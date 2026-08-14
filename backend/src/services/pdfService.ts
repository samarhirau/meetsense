import PDFDocument from 'pdfkit';
import { IMeeting } from '../models/Meeting';
import { ITask } from '../models/Task';

/**
 * Generates a print-friendly PDF of the meeting summary, decisions, follow-ups, and action items.
 * Uses pdfkit to generate the document server-side.
 */
export const generateMeetingPDF = (
  meeting: IMeeting,
  tasks: ITask[],
  outStream: NodeJS.WritableStream
): void => {
  // Initialize PDF document with bufferPages enabled for post-processing page numbering
  const doc = new PDFDocument({
    size: 'A4',
    bufferPages: true,
    margins: {
      top: 75,
      bottom: 75,
      left: 50,
      right: 50
    }
  });

  // Pipe output directly to express response stream
  doc.pipe(outStream);

  const brandAccent = '#7FE0B5'; // Mint/signal green
  const brandDark = '#0F1210';
  const textMuted = '#8A928C';
  const contentWidth = 495; // A4 width (595) - left/right margins (100)

  // --- 1. TITLE & METADATA ---
  doc.font('Helvetica-Bold').fontSize(20).fillColor(brandDark).text(meeting.title.toUpperCase(), { lineGap: 4 });
  
  const recordDate = new Date(meeting.createdAt).toLocaleString();
  doc.font('Courier').fontSize(9).fillColor(textMuted).text(`RECORD DATE: ${recordDate.toUpperCase()}`);
  doc.moveDown(2);

  // --- 2. SUMMARY SECTION ---
  doc.font('Courier-Bold').fontSize(10).fillColor(textMuted).text('SUMMARY', { characterSpacing: 1.5 });
  doc.moveDown(0.4);
  
  doc.font('Helvetica').fontSize(10).fillColor(brandDark).text(meeting.summary || 'No summary generated.', {
    width: contentWidth,
    align: 'justify',
    lineGap: 3
  });
  doc.moveDown(2);

  // --- 3. DECISIONS MADE ---
  if (meeting.decisions && meeting.decisions.length > 0) {
    doc.font('Courier-Bold').fontSize(10).fillColor(textMuted).text('KEY DECISIONS', { characterSpacing: 1.5 });
    doc.moveDown(0.5);
    
    doc.font('Helvetica').fontSize(9.5).fillColor(brandDark);
    meeting.decisions.forEach((decision) => {
      doc.text(`•  ${decision}`, {
        width: contentWidth,
        lineGap: 2
      });
      doc.moveDown(0.3);
    });
    doc.moveDown(1.5);
  }

  // --- 4. FOLLOW-UPS ---
  if (meeting.followUps && meeting.followUps.length > 0) {
    doc.font('Courier-Bold').fontSize(10).fillColor(textMuted).text('DEFERRED FOLLOW-UPS', { characterSpacing: 1.5 });
    doc.moveDown(0.5);
    
    doc.font('Helvetica').fontSize(9.5).fillColor(brandDark);
    meeting.followUps.forEach((item) => {
      doc.text(`•  ${item}`, {
        width: contentWidth,
        lineGap: 2
      });
      doc.moveDown(0.3);
    });
    doc.moveDown(1.5);
  }

  // --- 5. ACTION ITEMS TABLE ---
  if (tasks && tasks.length > 0) {
    doc.font('Courier-Bold').fontSize(10).fillColor(textMuted).text('ACTION ITEMS CHECKLIST', { characterSpacing: 1.5 });
    doc.moveDown(0.6);

    let y = doc.y;

    // Define table columns
    const colX = {
      task: 50,
      assigned: 275,
      deadline: 375,
      status: 475
    };

    const colWidths = {
      task: 215,
      assigned: 90,
      deadline: 90,
      status: 70
    };

    // Draw header row background
    doc.rect(50, y, contentWidth, 20).fill('#171B19');
    
    // Draw header row labels
    doc.font('Courier-Bold').fontSize(8.5).fillColor('#EDEFEC');
    doc.text('TASK DESCRIPTION', colX.task + 5, y + 6, { width: colWidths.task });
    doc.text('ASSIGNED TO', colX.assigned + 5, y + 6, { width: colWidths.assigned });
    doc.text('DEADLINE', colX.deadline + 5, y + 6, { width: colWidths.deadline });
    doc.text('STATUS', colX.status + 5, y + 6, { width: colWidths.status });
    
    y += 20;

    // Draw data rows
    tasks.forEach((task, index) => {
      // Calculate row height based on text wrapping
      doc.font('Helvetica').fontSize(9);
      const textHeight = doc.heightOfString(task.task, { width: colWidths.task - 10 });
      const rowHeight = Math.max(textHeight + 10, 24);

      // Check page break limit (A4 bottom limit is roughly 750 pt)
      if (y + rowHeight > 750) {
        doc.addPage();
        y = 75; // reset y to top margin of new page

        // Redraw table headers on new page
        doc.rect(50, y, contentWidth, 20).fill('#171B19');
        doc.font('Courier-Bold').fontSize(8.5).fillColor('#EDEFEC');
        doc.text('TASK DESCRIPTION', colX.task + 5, y + 6, { width: colWidths.task });
        doc.text('ASSIGNED TO', colX.assigned + 5, y + 6, { width: colWidths.assigned });
        doc.text('DEADLINE', colX.deadline + 5, y + 6, { width: colWidths.deadline });
        doc.text('STATUS', colX.status + 5, y + 6, { width: colWidths.status });
        y += 20;
      }

      // Draw alternating row background shading
      if (index % 2 === 0) {
        doc.rect(50, y, contentWidth, rowHeight).fill('#F6F8F7');
      }

      // Draw cell text
      doc.fillColor(brandDark);
      doc.font('Helvetica');
      doc.text(task.task, colX.task + 5, y + 6, { width: colWidths.task - 10 });
      doc.text(task.assignedTo, colX.assigned + 5, y + 6, { width: colWidths.assigned - 10 });
      doc.text(task.deadline, colX.deadline + 5, y + 6, { width: colWidths.deadline - 10 });

      // Draw status label with styling (uppercase mono font)
      doc.font('Courier-Bold').fontSize(8);
      if (task.status === 'done') {
        doc.fillColor('#558C73').text('DONE', colX.status + 5, y + 7);
      } else if (task.status === 'in-progress') {
        doc.fillColor('#F2C078').text('IN PROGRESS', colX.status + 5, y + 7);
      } else {
        doc.fillColor('#8A928C').text('TO DO', colX.status + 5, y + 7);
      }

      y += rowHeight;
    });
  }

  // --- 6. PAGE HEADER & FOOTER POST-PROCESSING ---
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Temporarily set margins to 0 to prevent text from triggering auto page breaks
    const savedMargins = { ...doc.page.margins };
    doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };

    // Header Content
    doc.save();
    
    // Branded header wordmark & tagline
    doc.font('Courier-Bold').fontSize(14).fillColor('#171B19').text('MEETSENSE', 50, 28);
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#8A928C').text('meeting summary report', 142, 33);
    
    // Waveform Motif visual element next to header wordmark
    doc.strokeColor(brandAccent);
    doc.lineWidth(1.5);
    const bars = [6, 12, 8, 16, 14, 7, 11, 18, 13, 9, 15];
    for (let j = 0; j < bars.length; j++) {
      const x = 320 + j * 4.5;
      const h = bars[j] * 0.75;
      doc.moveTo(x, 35 - h / 2).lineTo(x, 35 + h / 2).stroke();
    }

    // Branded mint divider line under header
    doc.strokeColor(brandAccent).lineWidth(1).moveTo(50, 48).lineTo(545, 48).stroke();
    doc.restore();

    // Footer Content
    doc.save();
    // Footer separator line
    doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(50, 785).lineTo(545, 785).stroke();
    
    const timestampStr = new Date().toLocaleString().toUpperCase();
    doc.font('Courier').fontSize(7.5).fillColor(textMuted);
    
    // Left: Generated date
    doc.text(`DATE GENERATED: ${timestampStr}`, 50, 792);
    // Center: Branded line
    doc.text('GENERATED BY MEETSENSE', 0, 792, { align: 'center', width: 595 });
    // Right: Page number
    doc.text(`PAGE ${i + 1} OF ${range.count}`, 0, 792, { align: 'right', width: 545 });
    doc.restore();

    // Restore margins
    doc.page.margins = savedMargins;
  }

  // End and flush stream
  doc.end();
};
