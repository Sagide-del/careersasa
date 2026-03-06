import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export function generatePdfReport(opts: {
  outDir: string;
  filename: string;
  studentProfile: any;
  aiResult: any;
}) {
  const outPath = path.resolve(opts.outDir, opts.filename);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  doc.fontSize(20).text("CareerSasa - Career Guidance Report", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#444").text("Discover Your Best Career Path", { align: "center" });
  doc.moveDown(1);

  doc.fillColor("#000").fontSize(14).text("Student Profile");
  doc.moveDown(0.3);
  doc.fontSize(11).text(`KCSE Mean Grade: ${opts.studentProfile?.kcse?.meanGrade || "N/A"}`);
  doc.text(`Birth Order: ${opts.studentProfile?.family?.birthOrder || "N/A"}`);
  doc.text(`Guardian Support (1-5): ${opts.studentProfile?.family?.guardianSupport || "N/A"}`);
  doc.text(`Personality Snapshot: ${opts.studentProfile?.briggs?.type || "N/A"}`);
  doc.moveDown(0.7);

  const subjects = opts.studentProfile?.kcse?.subjects || [];
  if (subjects.length) {
    doc.fontSize(12).text("KCSE Subjects");
    doc.moveDown(0.2);
    doc.fontSize(10);
    for (const s of subjects) {
      if (s?.name) doc.text(`- ${s.name}: ${s.grade || "-"}`);
    }
    doc.moveDown(0.7);
  }

  const hobbies = opts.studentProfile?.interests?.hobbies || [];
  if (hobbies.length) {
    doc.fontSize(12).text("Hobbies / Interests");
    doc.moveDown(0.2);
    doc.fontSize(10).text(hobbies.map((h: string) => "- " + h).join("\n"));
    doc.moveDown(0.7);
  }

  doc.fontSize(14).text("AI Summary");
  doc.moveDown(0.3);

  const summary = opts.aiResult?.student_summary;
  if (summary) {
    doc.fontSize(11).text("Strengths:");
    doc.fontSize(10).text((summary.strengths || []).map((x: string) => "- " + x).join("\n") || "-");
    doc.moveDown(0.4);
    doc.fontSize(11).text("Growth Areas:");
    doc.fontSize(10).text((summary.growth_areas || []).map((x: string) => "- " + x).join("\n") || "-");
    doc.moveDown(0.7);
  }

  const paths = opts.aiResult?.top_3_career_pathways || [];
  doc.fontSize(14).text("Top 3 Career Pathways");
  doc.moveDown(0.4);

  for (const p of paths) {
    doc.fontSize(13).text(`${p.rank}. ${p.pathway_name}`);
    doc.moveDown(0.2);

    doc.fontSize(11).text("Why it fits:");
    doc.fontSize(10).text((p.why_fit || []).map((x: string) => "- " + x).join("\n") || "-");
    doc.moveDown(0.3);

    doc.fontSize(11).text("Suggested Programmes (KUCCPS):");
    doc.fontSize(10);
    for (const s of (p.suggested_programmes || [])) {
      doc.text(`- ${s.programme} - ${s.kuccps_notes}`);
    }
    doc.moveDown(0.3);

    doc.fontSize(11).text("Next steps:");
    doc.fontSize(10).text((p.next_steps || []).map((x: string) => "- " + x).join("\n") || "-");
    doc.moveDown(0.8);
  }

  doc.fontSize(9).fillColor("#666").text(
    "Disclaimer: This report provides guidance, not a final decision. Confirm KUCCPS requirements/cutoffs on the official portal.",
    { align: "left" }
  );

  doc.end();

  return new Promise<string>((resolve, reject) => {
    stream.on("finish", () => resolve(outPath));
    stream.on("error", reject);
  });
}
