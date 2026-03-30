import sq from "./sqlite.js";

const newClient = (clientIp: string): Promise<{ clientIdSavedInDatabase: number }> => {
  console.log("Client IP:", clientIp);
  return new Promise((resolve, reject) => {
    sq.run("INSERT INTO clients (ip) VALUES (?)", [clientIp], function (err) {
      if (err) reject(err);
      else resolve({ clientIdSavedInDatabase: this.lastID });
    });
  });
};

const removeClient = (clientId: number) => {
  sq.run("DELETE FROM clients WHERE id = ?", [clientId]);
};
export { newClient, removeClient };

type PendingMessage = { id: number; phone: string; message: string; created_at: number };

const savePendingMessage = (phone: string, message: string) => {
  sq.run("INSERT INTO pending_messages (phone, message, created_at) VALUES (?, ?, ?)", [
    phone,
    message,
    Date.now(),
  ]);
};

const getPendingMessages = (): Promise<PendingMessage[]> => {
  return new Promise((resolve, reject) => {
    sq.all<PendingMessage>("SELECT * FROM pending_messages ORDER BY created_at ASC", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const deletePendingMessage = (id: number) => {
  sq.run("DELETE FROM pending_messages WHERE id = ?", [id]);
};

export { savePendingMessage, getPendingMessages, deletePendingMessage };
