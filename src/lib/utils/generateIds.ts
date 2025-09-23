export function generateGRNumber(poNumber: string): string {
    const today = new Date();
    const datePart = today.toISOString().split("T")[0].replace(/-/g, "");
    return `GR-${datePart}.${poNumber}`;
}

export function generateInvoiceNumber(): string {
    const today = new Date();
    const datePart = today.toISOString().split("T")[0].replace(/-/g, "");
    return `INV-${datePart}`;
}