async function applyActiveReductions(products) {
  try {
    if (!window.firestore || !window.firestore.fetchAllReductions) {
      return products;
    }
    
    const reductions = await window.firestore.fetchAllReductions();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reductionsToDelete = [];
    const activeReductions = reductions.filter(r => {
      const startDate = new Date(r.dataStart);
      const endDate = new Date(r.dataEnd);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      const isActive = today >= startDate && today <= endDate;
      
      if (!isActive && today > endDate) {
        reductionsToDelete.push(r.id);
      }
      
      return isActive;
    });
    
    for (const id of reductionsToDelete) {
      try {
        await window.firestore.deleteReduction(id);
        console.log('Reducere expirată ștearsă - ID:', id);
      } catch (err) {
        console.error('Eroare la ștergerea reducerii expirate:', err);
      }
    }
    
    const updatedProducts = products.map(product => {
      const applicableReductions = activeReductions.filter(r => 
        Array.isArray(r.produse) && r.produse.includes(product.nume)
      );
      
      if (applicableReductions.length > 0) {
        const totalReducere = applicableReductions.reduce((sum, r) => sum + r.reducere, 0);
        const finalReducere = Math.min(totalReducere, 100);
        const pretRedus = Math.round(product.pret * (1 - finalReducere / 100));
        return {
          ...product,
          reducere: finalReducere,
          pretRedus: pretRedus
        };
      }
      
      const { reducere, pretRedus, ...productFaraReducere } = product;
      return productFaraReducere;
    });
    
    return updatedProducts;
  } catch (error) {
    console.error('Eroare la aplicarea reducerilor:', error);
    return products;
  }
}
