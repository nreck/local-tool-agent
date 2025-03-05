import { NextResponse, NextRequest } from "next/server";
import PDFParser from "pdf2json";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the PDF file
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
    }

    const pdfBuffer = await response.arrayBuffer();

    // Parse the PDF
    const pdfParser = new PDFParser();
    return new Promise((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData) => {
        reject(NextResponse.json({ error: errData.parserError }, { status: 500 }));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        resolve(NextResponse.json({ success: true, data: pdfData }));
      });

      pdfParser.parseBuffer(Buffer.from(pdfBuffer));
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
