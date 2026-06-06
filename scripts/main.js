// Cod scurt: Verifica daca link-ul user e vizibil, atunci ascunde butonul Google
// Folosim MutationObserver pentru a monitoriza orice schimbare la display-ul butoanelor

function checkAndFixAuthButtons() {
  const userLink = document.getElementById("userLink");
  const googleBtn = document.getElementById("googleLogin");
  const mobileGoogleBtn = document.getElementById("mobileGoogleLogin");
  
  if (userLink) {
    // Always keep Google login visible; userLink visibility is controlled by auth state.
    if (googleBtn) {
      googleBtn.style.display = "inline-block";
      googleBtn.style.visibility = "visible";
    }
    if (mobileGoogleBtn) {
      mobileGoogleBtn.style.display = "block";
      mobileGoogleBtn.style.visibility = "visible";
    }
  }
}

// Apelează imediat
checkAndFixAuthButtons();

// Monitorizează orice schimbare pe acele butoane
const observer = new MutationObserver((mutations) => {
  let needsCheck = false;
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && (
      mutation.target.id === "googleLogin" || 
      mutation.target.id === "mobileGoogleLogin" || 
      mutation.target.id === "userLink"
    )) {
      needsCheck = true;
    }
  });
  if (needsCheck) {
    checkAndFixAuthButtons();
  }
});

// Incepe observarea
const userLink = document.getElementById("userLink");
const googleBtn = document.getElementById("googleLogin");
const mobileGoogleBtn = document.getElementById("mobileGoogleLogin");

if (googleBtn) observer.observe(googleBtn, { attributes: true, attributeFilter: ['style', 'display'] });
if (mobileGoogleBtn) observer.observe(mobileGoogleBtn, { attributes: true, attributeFilter: ['style', 'display'] });
if (userLink) observer.observe(userLink, { attributes: true, attributeFilter: ['style', 'display'] });

// Apelează și periodic ca backup
setInterval(checkAndFixAuthButtons, 200);




const loginBtn = document.getElementById("googleLogin");
const link = document.getElementById("userLink");

// afișare comentarii publice
async function loadComentariiPublice() {
  const coms = JSON.parse(localStorage.getItem('comentarii') || '[]');
  const div = document.getElementById("comentariiPublice");
  if (!div) return;
  div.innerHTML = coms.map(c => `
    <div>
      <img src="${c.poza && c.poza.startsWith('data:') ? c.poza : (c.poza || '/imagini/poza.png')}" width="40" style="border-radius:50%">
      <b>${c.nume}</b>: ${c.text}
    </div>
  `).join("");
}
loadComentariiPublice();

