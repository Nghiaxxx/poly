// Utility functions for Excel export

export interface ExcelRow {
  [key: string]: string | number | Date;
}

export const createExcelTable = (data: ExcelRow[]) => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  
  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';
  
  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  headers.forEach((header: string) => {
    const th = document.createElement('th');
    th.textContent = header;
    th.style.border = '1px solid #ddd';
    th.style.padding = '8px';
    th.style.backgroundColor = '#f2f2f2';
    th.style.fontWeight = 'bold';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Body
  const tbody = document.createElement('tbody');
  data.forEach(row => {
    const tr = document.createElement('tr');
    headers.forEach((header: string) => {
      const td = document.createElement('td');
      td.textContent = String(row[header] || '');
      td.style.border = '1px solid #ddd';
      td.style.padding = '8px';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  
  return table.outerHTML;
};

export const downloadExcel = (htmlContent: string, filename: string) => {
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadCSV = (data: ExcelRow[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
  );
  
  // Thêm BOM để Excel hiển thị tiếng Việt đúng
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers, ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}; 