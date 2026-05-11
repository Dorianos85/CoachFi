function normalizeCertificateName(value: string) {
  return decodeURIComponent(value)
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Coach FI Certificate";
}

export async function GET(
  req: Request,
  context: { params: Promise<{ certificateName: string }> }
) {
  const { certificateName } = await context.params;
  const safeName = normalizeCertificateName(certificateName);
  const imageUrl = new URL("/icon-512.png", req.url).toString();

  return Response.json(
    {
      name: `Coach FI - ${safeName}`,
      description:
        "A non-speculative Coach FI education certificate issued for financial literacy progress.",
      image: imageUrl,
      external_url: new URL("/rewards", req.url).toString(),
      attributes: [
        { trait_type: "Platform", value: "Coach FI" },
        { trait_type: "Network", value: "Solana Devnet" },
        { trait_type: "Certificate", value: safeName },
        { trait_type: "Purpose", value: "Financial education proof" },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
