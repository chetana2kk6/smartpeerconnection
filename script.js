/* ===== AUTH ===== */

// Inside script tag of auth.html
function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) return showError("Fill all fields");

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Save the new user to the "users" collection
      return firebase.firestore().collection("users").doc(userCredential.user.uid).set({
        name: email.split('@')[0], // Use email prefix as default name
        skills: "New Member",
        pic: "👤",
        role: "Contributor",
        status: "grow",
        email: email
      });
    })
    .then(() => {
      showError("Account created!", true);
      setTimeout(() => window.location.href = "home.html", 1000);
    })
    .catch(err => showError(err.message));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "home.html";
    })
    .catch(err => showError(err.message));
}

function showError(text) {
  const msg = document.getElementById("msg");
  if (msg) {
    msg.style.color = "red";
    msg.innerText = text;
  }
}

/* ===== MATCHING LOGIC (Demo, for home.html) ===== */

function calculateMatch(userSkills, peerSkills, hackathons) {
  let score = 0;
  const u = userSkills.split(",");
  const p = peerSkills.split(",");

  u.forEach(skill => {
    if (p.includes(skill.trim())) score += 10;
  });

  score += hackathons * 10;
  return Math.min(score, 100);
}

function readiness(score) {
  if (score >= 80) return "Hackathon Ready 🚀";
  if (score >= 60) return "Moderate Readiness ⚠️";
  return "Needs Skill Growth ❌";
}

function role(skills) {
  skills = skills.toLowerCase();
  if (skills.includes("ui") || skills.includes("css")) return "UI/UX Designer";
  if (skills.includes("java") || skills.includes("backend")) return "Backend Developer";
  if (skills.includes("python") || skills.includes("ml")) return "ML Engineer";
  return "Contributor";
}

function skillGap(goal) {
  goal = goal.toLowerCase();
  if (goal.includes("data")) return "Learn SQL and Statistics.";
  if (goal.includes("web")) return "Improve JavaScript and React.";
  if (goal.includes("android")) return "Learn Kotlin and Firebase Auth.";
  return "Strengthen core fundamentals.";
}

function showMatch() {
  const user = document.getElementById("userSkills").value;
  const peer = document.getElementById("peerSkills").value;
  const hacks = parseInt(document.getElementById("hackathons").value || "0", 10);
  const goal = document.getElementById("goal").value;

  const score = calculateMatch(user, peer, hacks);

  document.getElementById("result").innerHTML =
    `Match Score: ${score}%<br>
     Status: ${readiness(score)}<br>
     Suggested Role: ${role(peer)}<br>
     Skill Gap: ${skillGap(goal)}`;
}
/* ===== CONNECTION SYSTEM ===== */

function connectUser(name, skills) {
  let connections = JSON.parse(localStorage.getItem("connections")) || [];

  // Avoid duplicates
  const exists = connections.some(c => c.name === name);
  if (exists) {
    alert("Already connected with this user");
    return;
  }

  connections.push({
    name: name,
    skills: skills,
    connectedAt: new Date().toLocaleDateString()
  });

  localStorage.setItem("connections", JSON.stringify(connections));

  alert("Connected successfully!");
}
// 🔐 Check login & route correctly
function handleGetStarted() {
  const user = localStorage.getItem("smartpeerUser");

  if (user) {
    // already logged in → go to home
    window.location.href = "home.html";
  } else {
    // not logged in → go to LOGIN only
    window.location.href = "auth.html?mode=login";
  }
}

function handleJoin() {
  // Always go to REGISTER page
  window.location.href = "auth.html?mode=register";
}
// ===== CONNECTION LOGIC =====

// Connect with a peer
function connectWithPeer(peerId, peerName) {
  const user = firebase.auth().currentUser;
  if (!user) return alert("Please login first");

  const userRef = firebase.firestore().collection("users").doc(user.uid);

  userRef.update({
    connections: firebase.firestore.FieldValue.arrayUnion({
      id: peerId,
      name: peerName,
      connectedAt: new Date().toISOString()
    })
  }).then(() => {
    alert(`Connected with ${peerName}`);
    loadConnections(); // refresh UI
  });
}

// Load connections
function loadConnections() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  firebase.firestore()
    .collection("users")
    .doc(user.uid)
    .get()
    .then(doc => {
      const data = doc.data();
      const container = document.getElementById("connectionsList");

      if (!container) return;

      container.innerHTML = "";

      if (!data || !data.connections || data.connections.length === 0) {
        container.innerHTML = "<p>No connections yet. Start exploring peers!</p>";
        return;
      }

      data.connections.forEach(conn => {
        const div = document.createElement("div");
        div.className = "badge badge-ready";
        div.textContent = conn.name;
        container.appendChild(div);
      });
    });
}

