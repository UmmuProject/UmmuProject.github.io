function uploadExcel() {
    const formData = new FormData();
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];

    formData.append('excelFile', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Tampilkan data dari file Excel di dalam div excelData
        const excelDataDiv = document.getElementById('excelData');
        excelDataDiv.innerHTML = '';

        const table = document.createElement('table');
        table.border = '1';
        table.style.borderCollapse = 'collapse';
        excelDataDiv.appendChild(table);

        // Tambahkan header tabel
        const headerRow = table.insertRow();
        data.headers.forEach(header => {
            const cell = headerRow.insertCell();
            cell.textContent = header;
            cell.style.fontWeight = 'bold';
            cell.style.padding = '8px';
        });

        // Tambahkan baris data
        data.rows.forEach(rowData => {
            const row = table.insertRow();
            Object.values(rowData).forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value;
                cell.style.padding = '8px';
            });
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
