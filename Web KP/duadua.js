let dataStorage = JSON.parse(localStorage.getItem('duaduaDataStorage')) || [];

document.addEventListener('DOMContentLoaded', loadData);
document.getElementById('addButton').addEventListener('click', () => {
    document.getElementById('uploadFormContainer').style.display = 'block';
});
document.getElementById('saveButton').addEventListener('click', saveData, false);

function handleFormSubmit() {
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

        // Get column indices for relevant columns
        const headers = json[0];
        const relevantColumns = ['Plant', 'Plant Desc.', 'S.Loc Desc.', 'Material', 'Material Desc.', 'Unrestricted-Use Stock'];
        const columnIndices = relevantColumns.map(col => headers.indexOf(col));

        // Filter data to include only relevant columns and rows with Plant code F343
        const filteredData = json
            .filter((row, index) => {
                if (index === 0) return true; // Keep header row
                const plantCode = row[headers.indexOf('Plant')];
                return plantCode === 'F343';
            })
            .map(row => columnIndices.map(index => row[index]));

        dataStorage.push({
            keterangan: keterangan,
            fileData: filteredData
        });

        displayData();
        document.getElementById('uploadForm').reset();
        document.getElementById('uploadFormContainer').style.display = 'none';
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
    detailWindow.document.write('<html><head><title>Details</title><style>body{font-family: Arial, sans-serif;}table{width: 100%; border-collapse: collapse;}th, td{padding: 8px; text-align: left; border-bottom: 1px solid #ddd;}th{background-color: #f2f2f2;}tr:hover{background-color: #f5f5f5;}#searchInput, #filterColumn{margin-bottom: 12px; padding: 8px; border: 1px solid #ddd;}</style></head><body>');
    detailWindow.document.write(`
        <label for="filterColumn">Filter by:</label>
        <select id="filterColumn">
            ${data[0].map((header, index) => `<option value="${index}">${header}</option>`).join('')}
        </select>
        <input type="text" id="searchInput" onkeyup="filterTable()" placeholder="Search...">
        <table id="detailTable" border="1">
            <thead>
                <tr>
                    ${data[0].map(header => `<th>${header}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${data.slice(1).map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
        </table>
        <script>
            function filterTable() {
                var filterColumn, input, filter, table, tr, td, i, txtValue;
                filterColumn = document.getElementById("filterColumn").value;
                input = document.getElementById("searchInput");
                filter = input.value.toUpperCase();
                table = document.getElementById("detailTable");
                tr = table.getElementsByTagName("tr");

                for (i = 1; i < tr.length; i++) {
                    tr[i].style.display = "none"; // Start with hiding rows
                    td = tr[i].getElementsByTagName("td")[filterColumn];
                    if (td) {
                        txtValue = td.textContent || td.innerText;
                        if (txtValue.toUpperCase().indexOf(filter) > -1) {
                            tr[i].style.display = ""; // Show row if match found
                        }
                    }
                }
            }
        </script>
    `);
    detailWindow.document.write('</body></html>');
}

function editData(index) {
    const newData = prompt('Enter new data:');
    if (newData) {
        dataStorage[index].keterangan = newData;
        displayData();
        saveData();
    }
}

function deleteData(index) {
    if (confirm('Are you sure you want to delete this data?')) {
        dataStorage.splice(index, 1);
        displayData();
        saveData();
    }
}

function saveData() {
    localStorage.setItem('duaduaDataStorage', JSON.stringify(dataStorage));
    alert('Data saved successfully!');
}

function loadData() {
    displayData();
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
