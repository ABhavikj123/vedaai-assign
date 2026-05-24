import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
import type { Response } from "express";
import type { AssignmentDocument } from "../models/Assignment.js";

const drawLine = (
  doc: PDFKit.PDFDocument,
  x1: number,
  y: number,
  x2: number
) => {
  doc
    .moveTo(x1, y)
    .lineTo(x2, y)
    .strokeColor("#222222")
    .lineWidth(0.5)
    .stroke();
};

export const streamAssignmentPdf = (
  assignment: AssignmentDocument,
  res: Response
): void => {
  if (!assignment.generatedPaper) {
    throw new Error("Assignment does not have a generated paper yet");
  }

  const paper = assignment.generatedPaper;

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    bufferPages: true,
    compress: false
  });

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${assignment.title
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()}-paper.pdf"`
  );

  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => {
    chunks.push(chunk);
  });

  doc.on("end", () => {
    const result = Buffer.concat(chunks);
    res.setHeader("Content-Length", result.length);
    res.end(result);
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(paper.schoolName, {
      align: "center"
    });

  doc.moveDown(0.3);

  doc
    .font("Helvetica")
    .fontSize(12)
    .text(`${paper.subject} | ${paper.class}`, {
      align: "center"
    });

  doc.moveDown(0.25);

  doc
    .font("Helvetica")
    .fontSize(10)
    .text(
      `Time: ${paper.timeAllowedMinutes} min | Max Marks: ${paper.maximumMarks}`,
      {
        align: "center"
      }
    );

  doc.moveDown(0.5);
  drawLine(doc, 40, doc.y, 555);
  doc.moveDown(0.8);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Student Information");

  doc.moveDown(0.5);
  doc.font("Helvetica").fontSize(10);

  const infoY = doc.y;
  doc.text("Name:", 40, infoY);
  drawLine(doc, 80, infoY + 10, 250);

  doc.text("Roll:", 270, infoY);
  drawLine(doc, 300, infoY + 10, 555);

  doc.moveDown(1);
  doc.text("Section:", 40, doc.y);
  drawLine(doc, 85, doc.y + 10, 250);
  doc.moveDown(1.2);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("General Instructions");

  doc.moveDown(0.4);
  doc.font("Helvetica").fontSize(9);

  paper.generalInstructions.forEach((instruction, index) => {
    doc.text(`${index + 1}. ${instruction}`, {
      indent: 10,
      width: 515,
      lineGap: 2
    });
    doc.moveDown(0.2);
  });

  doc.moveDown(1);

  paper.sections.forEach((section) => {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.moveDown(1.2);
    const sectionTitle = `Section ${section.sectionLetter}: ${section.sectionTitle}`;
    doc.x = 40;

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(sectionTitle, 40, doc.y, {
        width: 515,
        align: "center",
        lineBreak: true
      });

    doc.moveDown(0.5);
    doc.x = 40;

    doc
      .font("Helvetica-Oblique")
      .fontSize(10)
      .text(section.sectionInstruction, 40, doc.y, {
        width: 515,
        align: "center",
        lineGap: 2
      });

    doc.moveDown(1);

    section.questions.forEach((question, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      const questionNum = `${index + 1}. `;
      const marksText = `[${question.marks}m]`;
      const startY = doc.y;

      doc.font("Helvetica").fontSize(10);
      const questionText = questionNum + question.questionText;

      doc.text(questionText, 40, startY, {
        width: 465,
        align: "left",
        lineGap: 3
      });

      const questionHeight = doc.heightOfString(questionText, {
        width: 465,
        lineGap: 3
      });

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(marksText, 515, startY, {
          width: 40,
          align: "right"
        });

      doc.x = 40;
      doc.y = startY + questionHeight + 8;

      if (question.diagramSvg) {
        const svgHeight = 160;
        const svgWidth = 400;

        if (doc.y + svgHeight > 740) {
          doc.addPage();
        }

        const currentX = doc.x;
        const currentY = doc.y;

        try {
          SVGtoPDF(doc, question.diagramSvg, currentX + 50, currentY, {
            width: svgWidth,
            height: svgHeight,
            preserveAspectRatio: "xMidYMid meet"
          });
        } catch (svgError) {
          console.error("Failed drawing question canvas vector vector maps:", svgError);
        }

        doc.x = 40;
        doc.y = currentY + svgHeight + 14;
      } else {
        doc.y = doc.y + 10;
      }
    });

    doc.moveDown(0.8);
  });

  doc.addPage();

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("Answer Key", {
      align: "center"
    });

  doc.moveDown(1);
  doc.font("Helvetica").fontSize(10);

  paper.answerKey.forEach((answer) => {
    if (doc.y > 740) {
      doc.addPage();
    }

    doc.text(`Q${answer.questionId}: ${answer.answerText}`, {
      width: 515,
      lineGap: 2
    });

    doc.x = 40;
    doc.moveDown(0.5);
  });

  doc.end();
};