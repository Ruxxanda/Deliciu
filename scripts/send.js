document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("prodForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const nume = document.getElementById("nume").value;
        const descriere = document.getElementById("descriere").value;
        const imagine = document.getElementById("imagine").files[0];
        const pret = document.getElementById("pret").value;

        let linkImagine = "../imagini/poza.png"; // default

        if (imagine) {
            let formData = new FormData();
            formData.append("file", imagine);

            const uploadRes = await fetch("http://localhost:3000/upload", {
                method: "POST",
                body: formData
            });

            const uploadData = await uploadRes.json();

            if (uploadData.status !== "success") {
                console.error("Eroare la încărcarea imaginii!");
                return;
            }

            linkImagine = uploadData.link;
        }

        try {
            const response = await fetch("http://localhost:3000/addProduct", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nume,
                    descriere,
                    linkImagine,
                    pret
                })
            });

            console.log("Response status:", response.status);
            const result = await response.json();
            console.log("Result:", result);

            if (response.ok && result.status === 'success') {
                console.log("Produs publicat cu succes!");
            } else if (result.status === 'error') {
                console.error(result.message);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    });
});
