import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

const SERVER_JSON = "http://localhost:3005";       // your mock backend
const AI_SERVER = "http://localhost:3001/api/generate-answer";  // real AI backend

const HomeScreen = () => {
  const [question, setQuestion] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ------------------------------
  // LOAD POSTS
  // ------------------------------
  const fetchPosts = async () => {
    try {
      const res = await fetch(`${SERVER_JSON}/posts`);
      const data = await res.json();
      setPosts(data.reverse()); // newest first
    } catch (e) {
      console.log("Post fetch error:", e);
    } finally {
      setLoadingPosts(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // ------------------------------
  // AI SUMMARY
  // ------------------------------
  const generateAISummary = async () => {
    if (!question.trim()) return;

    setLoadingAI(true);
    try {
      const res = await fetch(AI_SERVER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          keywords: []   // optional for now
        })
      });

      const data = await res.json();
      setAiSummary(data.answer || "No AI response.");
    } catch (error) {
      console.log("AI error:", error);
      setAiSummary("Error generating summary.");
    }
    setLoadingAI(false);
  };

  // ------------------------------
  // CREATE POST
  // ------------------------------
  const createPost = async () => {
    if (!question.trim()) return;

    const newPost = {
      text: question,
      aiSummary: aiSummary
    };

    try {
      const res = await fetch(`${SERVER_JSON}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      const saved = await res.json();
      setPosts([saved, ...posts]);
      setQuestion("");
      setAiSummary("");
    } catch (e) {
      console.log("Post creation error:", e);
    }
  };

  // ------------------------------
  // VOTE
  // ------------------------------
  const vote = async (postId, direction) => {
    try {
      const res = await fetch(`${SERVER_JSON}/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction })
      });

      const updated = await res.json();

      setPosts(prev =>
        prev.map(p => (p.id === updated.id ? updated : p))
      );
    } catch (e) {
      console.log("Vote error:", e);
    }
  };

  // ------------------------------
  // RENDER POST ITEM
  // ------------------------------
  const renderItem = ({ item }) => (
    <View style={styles.postBox}>
      <Text style={styles.postText}>{item.text}</Text>

      <Text style={styles.subHeader}>AI Summary</Text>
      <Text style={styles.aiSummary}>{item.aiSummary}</Text>

      <View style={styles.voteRow}>
        <TouchableOpacity onPress={() => vote(item.id, "up")} style={styles.voteBtn}>
          <Text style={styles.voteText}>▲</Text>
        </TouchableOpacity>

        <Text style={styles.voteCount}>{item.votes}</Text>

        <TouchableOpacity onPress={() => vote(item.id, "down")} style={styles.voteBtn}>
          <Text style={styles.voteText}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ------------------------------
  // UI
  // ------------------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>

        {/* HEADER */}
        <Text style={styles.header}>AI Question Checker</Text>

        {/* QUESTION BOX */}
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Type your question..."
          style={styles.input}
          multiline
        />

        {/* AI BUTTON */}
        <TouchableOpacity
          onPress={generateAISummary}
          style={styles.aiButton}
          disabled={loadingAI}
        >
          <Text style={styles.aiButtonText}>
            {loadingAI ? "Thinking..." : "Generate AI Summary"}
          </Text>
        </TouchableOpacity>

        {/* AI PREVIEW */}
        {aiSummary !== "" && (
          <View style={styles.aiPreviewBox}>
            <Text style={styles.subHeader}>AI Summary Preview</Text>
            <Text style={styles.aiSummary}>{aiSummary}</Text>
          </View>
        )}

        {/* CREATE POST */}
        {aiSummary !== "" && (
          <TouchableOpacity
            onPress={createPost}
            style={styles.postButton}
          >
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        )}

        {/* POSTS LIST */}
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {
              setRefreshing(true);
              fetchPosts();
            }} />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />

      </View>
    </KeyboardAvoidingView>
  );
};

// ------------------------------
// STYLES
// ------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: "#ffffff"
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10
  },
  input: {
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontSize: 16,
    marginBottom: 10
  },
  aiButton: {
    backgroundColor: "#3A4B8E",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  aiPreviewBox: {
    backgroundColor: "#eef0ff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12
  },
  subHeader: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4
  },
  aiSummary: {
    fontSize: 14,
    color: "#555"
  },
  postButton: {
    backgroundColor: "#2b7a4b",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  },
  postBox: {
    backgroundColor: "#fafafa",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  postText: {
    fontSize: 16,
    marginBottom: 8
  },
  voteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10
  },
  voteBtn: {
    paddingHorizontal: 12
  },
  voteText: {
    fontSize: 20
  },
  voteCount: {
    fontSize: 16,
    fontWeight: "600"
  }
});

export default HomeScreen;
