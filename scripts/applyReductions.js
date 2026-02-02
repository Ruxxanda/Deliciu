// Function to apply active reductions from Firestore to products
async function applyActiveReductions(products) {
  try {
    // Wait for firebase to be ready
    if (!window.firestore || !window.firestore.fetchAllReductions) {
      return products;
    }
    
    // Fetch reductions from Firestore
    const reductions = await window.firestore.fetchAllReductions();
    
    // Filter by date to get active reductions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Șterge automat reducerile expirate
    const reductionsToDelete = [];
    const activeReductions = reductions.filter(r => {
      const startDate = new Date(r.dataStart);
      const endDate = new Date(r.dataEnd);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const isActive = today >= startDate && today <= endDate;
      
      // Dacă e expirat, marchează pentru ștergere
      if (!isActive && today > endDate) {
        reductionsToDelete.push(r.id);
      }
      
      return isActive;
    });
    
    // Șterge reducerile expirate din Firestore
    for (const id of reductionsToDelete) {
      try {
        await window.firestore.deleteReduction(id);
        console.log('Reducere expirată ștearsă - ID:', id);
      } catch (err) {
        console.error('Eroare la ștergerea reducerii expirate:', err);
      }
    }
    
    // Apply reductions to products - suma reducerilor daca sunt mai multe
    const updatedProducts = products.map(product => {
      // Gaseste TOATE reducerile care contin acest produs
      const applicableReductions = activeReductions.filter(r => 
        Array.isArray(r.produse) && r.produse.includes(product.nume)
      );
      
      if (applicableReductions.length > 0) {
        // Aduna toate procentele de reducere
        const totalReducere = applicableReductions.reduce((sum, r) => sum + r.reducere, 0);
        // Limita la maxim 100%
        const finalReducere = Math.min(totalReducere, 100);
        const pretRedus = Math.round(product.pret * (1 - finalReducere / 100));
        return {
          ...product,
          reducere: finalReducere,
          pretRedus: pretRedus
        };
      }
      
      // Daca nu e in nicio reducere activa, elimina reducerile
      const { reducere, pretRedus, ...productFaraReducere } = product;
      return productFaraReducere;
    });
    
    return updatedProducts;
  } catch (error) {
    console.error('Eroare la aplicarea reducerilor:', error);
    return products;
  }
}
