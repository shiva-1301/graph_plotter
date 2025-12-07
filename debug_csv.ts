import fs from 'fs';
import Papa from 'papaparse';

const fileContent = fs.readFileSync('c:/Users/ME/Desktop/Graphs/Book1.csv', 'utf8');

Papa.parse(fileContent, {
    header: false,
    skipEmptyLines: true,
    complete: (results) => {
        const rows = results.data as string[][];
        const headers = rows[0];
        const row1 = rows[1]; // First data row (index 2 in file)
        const row2 = rows[2]; // Second data row

        console.log("--- CSV DEBUG ANALYSIS ---");
        console.log("Header Count:", headers.length);
        console.log("Row 1 Count:", row1.length);

        console.log("\n--- Column Mapping ---");
        headers.forEach((h, i) => {
            if (h.includes("DCRM") || h.includes("Coil") || h.includes("Travel")) {
                // Assuming implicit time column (index 0), data is shifted by +1?
                // Or if headers align perfectly?
                console.log(`Index ${i}: Header="${h}"`);
                console.log(`   Row1[${i}] = "${row1[i]}"`);
                console.log(`   Row1[${i + 1}] = "${row1[i + 1]}" (Shifted +1)`);
            }
        });
    }
});
