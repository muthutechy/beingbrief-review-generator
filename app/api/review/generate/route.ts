import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReviews } from "@/lib/ai";
import { safetyCheck } from "@/lib/safety";

export async function POST(req: Request) {
  const body = await req.json();

  const business = await prisma.business.findUnique({
    where: { id: body.businessId },
    include: { services: true, locations: true },
  });

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const reviews = await generateReviews({
    business: body.businessName,
    service: body.service,
    location: body.location,
    rating: body.rating,
    experiencePoints: body.experiencePoints || [],
    language: body.language,
    tone: body.tone,
    length: body.length,
  });

  const keywords = [
    ...business.services.map(s => s.name),
    ...business.locations.map(l => l.name),
    business.city,
  ];

  reviews.warnings = [
    ...(reviews.warnings || []),
    ...safetyCheck(`${reviews.short} ${reviews.medium} ${reviews.casual}`, keywords)
  ];

  const session = await prisma.reviewSession.create({
    data: {
      businessId: body.businessId,
      service: body.service,
      location: body.location,
      rating: body.rating,
      language: body.language,
      tone: body.tone,
      length: body.length,
      experiencePoints: body.experiencePoints || [],
      generatedReviews: reviews,
      staff: body.staff || null,
    },
  });

  await prisma.analytics.create({
    data: {
      businessId: body.businessId,
      actionType: "review_generated",
      metadata: { sessionId: session.id, staff: body.staff || null }
    }
  });

  return NextResponse.json({ reviews, sessionId: session.id });
}
