import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  profile_image_url: text("profile_image_url"),
});

export const character = pgTable("character", {
  id: serial("id").primaryKey(),
  name: text("name"),
  age: text("age"),
  profession: text("profession"),
  physical_appearance: text("physical_appearance"),
  personality: text("personality"),
  background: text("background"),
  tone_and_speech: text("tone_and_speech"),
  habits_and_mannerisms: text("habits_and_mannerisms"),
  profile_image: text("profile_image"),
  initial_message: text("initial_message")
});

export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chat_id: text("chat_id").notNull(),
  character_id: integer("character_id").references(() => character.id, {
    onDelete: "cascade",
  }),
  user_id: text("user_id"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chats = pgTable(
  "chats",
  {
    id: serial("id").primaryKey(),
    user_id: text("user_id").references(() => users.user_id, {
      onDelete: "cascade",
    }),
    character_id: integer("character_id").references(() => character.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (chats) => ({
    userIdIdx: index("idx_chats_user_id").on(chats.user_id), // Add index on user_id
    characterIdIdx: index("idx_chats_character_id").on(chats.character_id), // Optional: index on character_id
  })
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    chat_id: text("chat_id"),
    role: text({ enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (messages) => ({
    chatIdIdx: index("idx_messages_chat_id").on(messages.chat_id), // Add index on chat_id
  })
);
