import PDFDocument from 'pdfkit';

interface InvoiceData {
    invoiceId: string;
    registrationName: string;
    registrationEmail: string;
    eventTitle: string;
    amount: number;
    transactionId: string;
    paymentDate: string;
}

export const generateInvoicePdf = async (data: InvoiceData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            });

            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // Header
            doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text('Event Registration Services', { align: 'center' });
            doc.text('Your Participation, Our Priority', { align: 'center' });

            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(1);

            // Invoice Info
            doc.fontSize(11).font('Helvetica-Bold').text('Invoice Information');
            doc.fontSize(10).font('Helvetica')
                .text(`Invoice ID: ${data.invoiceId}`)
                .text(`Payment Date: ${new Date(data.paymentDate).toLocaleDateString()}`)
                .text(`Transaction ID: ${data.transactionId}`);

            doc.moveDown(0.8);

            // Registrant Info
            doc.fontSize(11).font('Helvetica-Bold').text('Registrant Information');
            doc.fontSize(10).font('Helvetica')
                .text(`Name: ${data.registrationName}`)
                .text(`Email: ${data.registrationEmail}`);

            doc.moveDown(0.8);

            // Event Info
            doc.fontSize(11).font('Helvetica-Bold').text('Event Information');
            doc.fontSize(10).font('Helvetica')
                .text(`Event: ${data.eventTitle}`);

            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(1);

            // Amount Table
            const tableTop = doc.y;
            const col1X = 50;
            const col2X = 450;

            doc.fontSize(11).font('Helvetica-Bold').text('Payment Summary', col1X, tableTop);
            doc.moveDown(0.8);

            const headerY = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Description', col1X, headerY);
            doc.text('Amount', col2X, headerY, { align: 'right' });

            doc.moveTo(col1X, doc.y).lineTo(col2X + 80, doc.y).stroke();
            doc.moveDown(0.5);

            const amountY = doc.y;
            doc.fontSize(10).font('Helvetica');
            doc.text('Event Registration Fee', col1X, amountY);
            doc.text(`${data.amount.toFixed(2)} BDT`, col2X, amountY, { align: 'right' });

            doc.moveDown(0.8);

            const totalY = doc.y;
            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('Total Amount', col1X, totalY);
            doc.text(`${data.amount.toFixed(2)} BDT`, col2X, totalY, { align: 'right' });

            doc.moveTo(col1X, doc.y).lineTo(col2X + 80, doc.y).stroke();
            doc.moveDown(1.5);

            // Footer
            doc.fontSize(9).font('Helvetica')
                .text('Thank you for registering. This is an electronically generated invoice.', { align: 'center' })
                .text('If you have questions, please contact support@example.com', { align: 'center' })
                .text('Payment processed securely through Stripe', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};