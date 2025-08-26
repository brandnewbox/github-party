import type * as Party from "partykit/server";
// TODO IAN this defines a party kit server which runs a web socket for us
// this defines how the websocker should work and send messages back and for to clients
// when we run in dev it does it locally but in prod this gets pushed to party kit and THEY opperate it 
// somehow throught that process we get accessed to the URL that it is at and THAT url is the one that 
// we will inject into the content.ts party socket thing
interface ConnectedUser {
  connectionId: string;
  userId: string;
  login: string;
}

interface ConnectedUsersMessage {
  type: "connected_users";
  users: Array<{
    id: string;
    login: string;
  }>;
}

interface UserStatusMessage {
  type: "user_status";
  action: "connected" | "disconnected";
  userId: string;
  login: string;
}

export default class Server implements Party.Server {
  connectedUsers: Map<string, ConnectedUser> = new Map();

  constructor(readonly party: Party.Party) { }

  private broadcastConnectedUsers() {
    const message: ConnectedUsersMessage = {
      type: "connected_users",
      users: Array.from(this.connectedUsers.values()).map(u => ({
        id: u.userId,
        login: u.login
      }))
    };
    this.party.broadcast(JSON.stringify(message));
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // We'll wait for the github_user message to add the user
  }

  async onClose(connection: Party.Connection<unknown>): Promise<void> {
    const user = this.connectedUsers.get(connection.id);
    if (user) {
      this.connectedUsers.delete(connection.id);
      
      // Notify everyone about the disconnection
      const statusMessage: UserStatusMessage = {
        type: "user_status",
        action: "disconnected",
        userId: user.userId,
        login: user.login
      };
      this.party.broadcast(JSON.stringify(statusMessage));

      // Update everyone with the new list of connected users
      this.broadcastConnectedUsers();
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      if (data.type === "github_user") {
        // Store the user information
        this.connectedUsers.set(sender.id, {
          connectionId: sender.id,
          userId: data.id,
          login: data.login
        });

        // Notify everyone about the new connection
        const statusMessage: UserStatusMessage = {
          type: "user_status",
          action: "connected",
          userId: data.id,
          login: data.login
        };
        this.party.broadcast(JSON.stringify(statusMessage));

        // Send current connected users to everyone
        this.broadcastConnectedUsers();
      }
    } catch (e) {
      console.error("Failed to parse message:", e);
    }
  }
}

Server satisfies Party.Worker;
