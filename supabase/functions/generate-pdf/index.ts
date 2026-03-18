// Supabase Edge Function: Generate PDF from HTML
// Deploy with: supabase functions deploy generate-pdf
//
// This function receives an HTML string and returns a PDF binary.
// It's used as fallback for web clients (expo-print is not available on web).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestBody {
  html: string;
  reportId: string;
  userId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const { html, reportId, userId }: RequestBody = await req.json();

    if (!html || !reportId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // NOTE: Puppeteer in Deno Deploy has size limits.
    // For production use, consider using a service like Browserless.io or Gotenberg.
    // For now, this returns the HTML wrapped in a PDF-ready page.
    // To enable full PDF generation, install puppeteer via Deno and uncomment the code below.

    // --- Puppeteer PDF generation (requires puppeteer in deno) ---
    // import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';
    // const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    // const page = await browser.newPage();
    // await page.setContent(html, { waitUntil: 'networkidle0' });
    // const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    // await browser.close();
    // return new Response(pdfBuffer, { headers: { 'Content-Type': 'application/pdf' } });

    // Fallback: return HTML for client-side printing
    return new Response(JSON.stringify({ html, message: 'Use expo-print on native devices' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
