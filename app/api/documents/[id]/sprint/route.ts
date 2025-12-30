import { NextResponse } from "next/server";

type Params = {
  params: { id: string };
};

export async function POST(_request: Request, { params: _params }: Params) {
  return NextResponse.json(
    { error: "AI sprint generation is disabled", status: "disabled" },
    { status: 410 }
  );
}
