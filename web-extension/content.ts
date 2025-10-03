import PartySocket from "partysocket";

// Find the right party room
const currentLocation = new URL(location.href)
let [repo, issueNumber] = currentLocation.pathname.split("/issues")
repo = repo.substring(1) // Drop the leading "/"
if (issueNumber) {
  issueNumber = issueNumber.replace("/", "")
}

let room = [repo, issueNumber].filter(Boolean).join("-")
console.log("Room:", room)

// Get GitHub user ID and login from meta tags
const userIdMeta = document.querySelector('meta[name="octolytics-actor-id"]')
const loginMeta = document.querySelector('meta[name="octolytics-actor-login"]')
const userId = userIdMeta?.getAttribute('content')
const login = loginMeta?.getAttribute('content')
console.log("User ID:", userId)
console.log("Login:", login)

// Create container for avatars
const avatarContainer = document.createElement('div')
avatarContainer.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
`
document.body.appendChild(avatarContainer)

// Function to create avatar element
function createAvatarElement(login: string) {
  const avatar = document.createElement('img')
  avatar.src = `https://github.com/${login}.png`
  avatar.alt = login
  avatar.title = login
  avatar.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #e1e4e8;
  `
  return avatar
}

// Keep track of connected users
const connectedUsers = new Set<string>()

// Function to update avatar display
function updateAvatars() {
  avatarContainer.innerHTML = ''
  connectedUsers.forEach(login => {
    avatarContainer.appendChild(createAvatarElement(login))
  })
}
const conn = new PartySocket({
  // TODO IAN START HERE we were peviouslly we were hard coding this to localhost and we were supposed to be inkjetting that in the build
  // process leveraging process.env so we can change it in dev/prod but are we changing it in prod? and if not how do we do this?
  // TODO IAN 2 we are setting this for dev in docker-compose.yml but that isn't used in prod
  // in prod we deploy to partykits cloud and build a chrome extension but nothing is injecting the env var.

  host: process.env.PARTY_HOST!,
  room: room
});

// Handle incoming messages
conn.addEventListener("message", (event) => {
  try {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case "connected_users":
        console.log("Connected users:", data.users);
        connectedUsers.clear()
        data.users.forEach((user: { id: string; login: string }) => connectedUsers.add(user.login))
        updateAvatars()
        break;
        
      case "user_status":
        console.log(`User ${data.login} has ${data.action}`);
        if (data.action === "connected") {
          connectedUsers.add(data.login)
        } else {
          connectedUsers.delete(data.login)
        }
        updateAvatars()
        break;
    }
  } catch (e) {
    console.error("Failed to parse message:", e);
  }
});

// Let's listen for when the connection opens
conn.addEventListener("open", () => {
  console.log("Connected!");
  if (userId && login) {
    conn.send(JSON.stringify({
      type: "github_user",
      id: userId,
      login: login
    }));
  }
});