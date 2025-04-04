
### **Conversations Table**  
- **Primary Key:**  
  - **PK:** `emplId`  
  - **SK:** `timestamp`  
- **Attributes:**  
  - `conversationId` (String, UUID)   
  - `title` (String)  
  - `createdAt` (ISO timestamp)  
  - `updatedAt` (ISO timestamp)  
- **Secondary Index:**  
  - **GSI (ConversationByIdIndex):**  
    - **PK:** `conversationKey`  
    - *Allows a user to fetch a conversation by conversationId.*  
---

### **Messages Table**  
- **Primary Key:**  
  - **PK:** `emplId#conversationId`  
  - **SK:** `timestamp`  
- **Attributes:**  
  - `id` (String, UUID)  
  - `role` (String) - `system` | `user` | `assistant`
  - `content` (String)  
  - `createdAt` (ISO timestamp)  

---

### **Shared Conversations Table**  
- **Primary Key:**  
  - **PK:** `sharedConversationId` (UUID)  
- **Attributes:**  
  - `originalConversationId` (String, UUID) – Links to the original conversation.  
  - `ownerId` (String) – The user who created the shared conversation.  
  - `createdAt` (ISO timestamp)  
  - `isPublic` (Boolean) – If `true`, anyone can view.  
  - `sharedWith` (List of Strings) – User IDs that can view.  
  - `title` (String) – Copied from the original conversation.  
- **Secondary Index:**  
  - **GSI (OwnerIdIndex):**  
    - **PK:** `ownerId`  
    - **SK:** `createdAt`  
    - *Allows a user to fetch a list of their shared conversations.*  

---

### **Shared Messages Table** *(NEW)*  
- **Primary Key:**  
  - **PK:** `sharedConversationId`  
  - **SK:** `timestamp`  
- **Attributes:**  
  - `id` (String, UUID)  
  - `role` (String)
  - `content` (String)  
  - `createdAt` (ISO timestamp)  

---
