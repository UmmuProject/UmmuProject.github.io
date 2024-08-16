let dataStorage = JSON.parse(localStorage.getItem('Realisasi1DataStorage')) || [];

document.addEventListener('DOMContentLoaded', loadData);
document.getElementById('addButton').addEventListener('click', () => {
    document.getElementById('uploadFormContainer').style.display = 'block';
});
document.getElementById('saveButton').addEventListener('click', saveData, false);
document.getElementById('uploadForm').addEventListener('submit', handleFormSubmit);

function handleFormSubmit(event) {
    event.preventDefault();
    const keterangan = document.getElementById('keterangan').value;
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const headers = json[0];
        const relevantColumns = ['Provinsi Distributor', 'Plant SO', 'Gudang SO Deskripsi', 'Nama Distributor', 'Deskripsi Material', 'Outstanding SO', 'Quantity SO', 'Tanggal SO Released'];
        const columnIndices = relevantColumns.map(col => headers.indexOf(col));

        const missingColumns = relevantColumns.filter((col, index) => columnIndices[index] === -1);

        if (missingColumns.length > 0) {
            alert(`File yang diunggah kehilangan kolom berikut: ${missingColumns.join(', ')}`);
            return;
        }

        const filteredData = json.map(row => {
            return columnIndices.map((index, i) => {
                let cellValue = row[index];
                if (i === relevantColumns.indexOf('Tanggal SO Released') && !isNaN(cellValue)) {
                    const date = new Date((cellValue - 25569) * 86400 * 1000);
                    return date.toISOString().split('T')[0];
                }
                return cellValue;
            });
        });

        dataStorage.push({
            keterangan: keterangan,
            fileData: [relevantColumns, ...filteredData.slice(1)]
        });
        displayData();
        document.getElementById('uploadForm').reset();
        document.getElementById('uploadFormContainer').style.display = 'none';
        saveData();
        alert('Data berhasil disimpan.');
    };

    reader.readAsArrayBuffer(file);
}

function displayData() {
    const tableBody = document.querySelector('#keteranganTable tbody');
    tableBody.innerHTML = '';

    dataStorage.forEach((data, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${data.keterangan}</td>
            <td>
                <button onclick="viewDetails(${index})">Details</button>
                <button onclick="editData(${index})">Edit</button>
                <button onclick="deleteData(${index})">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function viewDetails(index) {
    const data = dataStorage[index].fileData;
    const detailWindow = window.open('', '_blank');
    detailWindow.document.write(`
        <html>
        <head>
            <title>Details</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                }
                th, td {
                    padding: 4px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                th {
                    background-color: #f2f2f2;
                }
                tr:hover {
                    background-color: #f5f5f5;
                }
                #filterContainer {
                    display: flex;
                    flex-wrap: wrap;
                    margin: 10px 0;
                    padding: 8px;
                    border: 1px solid #ddd;
                    background-color: #f9f9f9;
                    border-radius: 4px;
                }
                #filterContainer label {
                    margin-right: 6px;
                    font-size: 12px;
                }
                #filterContainer select {
                    margin-right: 6px;
                    padding: 4px;
                    font-size: 12px;
                }
                #totalsRow {
                    font-weight: bold;
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <div id="filterContainer">
                <label for="provinceFilter">Province:</label>
                <select id="provinceFilter" onchange="filterData()">
                    <option value="">All Provinces</option>
                    ${Array.from(new Set(data.slice(1).map(row => row[0]))).map(province => `<option value="${province}">${province}</option>`).join('')}
                </select>
                <label for="materialFilter">Deskripsi Material:</label>
                <select id="materialFilter" multiple onchange="filterData()">
                    <option value="">All Materials</option>
                    ${Array.from(new Set(data.slice(1).map(row => row[4]))).map(material => `<option value="${material}">${material}</option>`).join('')}
                </select>
                <label for="monthFilter">Month:</label>
                <select id="monthFilter" onchange="filterData()">
                    <option value="">All Months</option>
                    ${Array.from(new Set(data.slice(1).map(row => row[7].split('-')[1]))).sort().map(month => `<option value="${month}">${month}</option>`).join('')}
                </select>
                <label for="yearFilter">Year:</label>
                <select id="yearFilter" onchange="filterData()">
                    <option value="">All Years</option>
                    ${Array.from(new Set(data.slice(1).map(row => row[7].split('-')[0]))).sort().map(year => `<option value="${year}">${year}</option>`).join('')}
                </select>
            </div>
            <table id="detailTable" border="1">
                <thead>
                    <tr>
                        ${data[0].map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.slice(1).map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                    <tr id="totalsRow">
                        ${Array(data[0].length - 4).fill('<td></td>').join('')}
                        <td><strong>Totals:</strong></td>
                        <td id="totalOutstandingSO"></td>
                        <td id="totalQuantitySO"></td>
                    </tr>
                </tbody>
            </table>
            <script>
                function filterData() {
                    const selectedProvince = document.getElementById('provinceFilter').value;
                    const selectedMaterials = Array.from(document.getElementById('materialFilter').selectedOptions).map(option => option.value);
                    const selectedMonth = document.getElementById('monthFilter').value;
                    const selectedYear = document.getElementById('yearFilter').value;

                    const table = document.getElementById('detailTable');
                    const tr = table.getElementsByTagName('tr');
                    let totalOutstandingSO = 0;
                    let totalQuantitySO = 0;

                    for (let i = 1; i < tr.length - 1; i++) {
                        const provinceTd = tr[i].getElementsByTagName('td')[0];
                        const materialTd = tr[i].getElementsByTagName('td')[4];
                        const outstandingSOTd = tr[i].getElementsByTagName('td')[5];
                        const quantitySOTd = tr[i].getElementsByTagName('td')[6];
                        const dateTd = tr[i].getElementsByTagName('td')[7];

                        if (provinceTd && materialTd && dateTd) {
                            const provinceText = provinceTd.textContent || provinceTd.innerText;
                            const materialText = materialTd.textContent || materialTd.innerText;
                            const dateText = dateTd.textContent || dateTd.innerText;

                            const provinceMatch = selectedProvince === '' || provinceText === selectedProvince;
                            const materialMatch = selectedMaterials.length === 0 || selectedMaterials.includes(materialText) || selectedMaterials.includes('');
                            const monthMatch = selectedMonth === '' || dateText.split('-')[1] === selectedMonth;
                            const yearMatch = selectedYear === '' || dateText.split('-')[0] === selectedYear;

                            const outstandingSOValue = parseFloat(outstandingSOTd.textContent || outstandingSOTd.innerText) || 0;

                            if (provinceMatch && materialMatch && monthMatch && yearMatch && outstandingSOValue !== 0) {
                                tr[i].style.display = '';
                                totalOutstandingSO += outstandingSOValue;
                                totalQuantitySO += parseFloat(quantitySOTd.textContent || quantitySOTd.innerText) || 0;
                            } else {
                                tr[i].style.display = 'none';
                            }
                        }
                    }
                    document.getElementById('totalOutstandingSO').textContent = totalOutstandingSO.toFixed(2);
                    document.getElementById('totalQuantitySO').textContent = totalQuantitySO.toFixed(2);
                }
            </script>
        </body>
        </html>
    `);
    detailWindow.document.close();
}


function saveData() {
    localStorage.setItem('Realisasi1DataStorage', JSON.stringify(dataStorage));
}

function loadData() {
    dataStorage = JSON.parse(localStorage.getItem('Realisasi1DataStorage')) || [];
    displayData();
}

function editData(index) {
    const newKeterangan = prompt('Edit keterangan:', dataStorage[index].keterangan);
    if (newKeterangan !== null) {
        dataStorage[index].keterangan = newKeterangan;
        saveData();
        displayData();
    }
}

function deleteData(index) {
    if (confirm('Are you sure you want to delete this data?')) {
        dataStorage.splice(index, 1);
        saveData();
        displayData();
    }
}

function openSidebar() {
    document.querySelector('.sidebar').style.width = '250px';
    document.querySelector('.main-content').style.marginLeft = '250px';
}

function closeSidebar() {
    document.querySelector('.sidebar').style.width = '0';
    document.querySelector('.main-content').style.marginLeft = '0';
}

function toggleSubmenu(event) {
    event.preventDefault();
    const submenu = event.target.nextElementSibling;
    submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
}

