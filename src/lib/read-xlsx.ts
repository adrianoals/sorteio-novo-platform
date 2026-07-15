import ExcelJS from "exceljs";

/** Lê a primeira planilha e devolve cada linha usando os títulos da primeira linha. */
export async function readFirstWorksheetRows(
  buffer: Buffer
): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, column) => {
    headers[column] = cell.text.trim();
  });

  const rows: Record<string, string>[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const result: Record<string, string> = {};
    let hasValue = false;

    for (let column = 1; column < headers.length; column++) {
      const header = headers[column];
      if (!header) continue;
      const value = row.getCell(column).text.trim();
      result[header] = value;
      if (value) hasValue = true;
    }

    if (hasValue) rows.push(result);
  }

  return rows;
}
