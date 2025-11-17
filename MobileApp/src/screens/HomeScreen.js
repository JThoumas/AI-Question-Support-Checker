import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StyledButton from '../components/StyledButton';
import API_BASE_URL from '../config/api';

const KEYWORD_OPTIONS = [
  'Internships',
  'Resume review',
  'Networking',
  'Interview prep',
  'Career change',
  'Tech',
  'Finance',
  'Grad school',
];

const HomeScreen = () => {
  const [question, setQuestion] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareToCommunity, setShareToCommunity] = useState(true);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshingPosts, setRefreshingPosts] = useState(false);

  const [commentTextMap, setCommentTextMap] = useState({});
  const [submittingCommentId, setSubmittingCommentId] = useState(null);
  const [votingPostId, setVotingPostId] = useState(null);

  const AI_BASE_URL = API_BASE_URL.replace('/api/auth', '/api');

  const JSON_SERVER_BASE_URL =
    Platform.OS === 'ios'
      ? 'http://localhost:3005'
      : 'http://10.0.2.2:3005';

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      if (!posts.length) setLoadingPosts(true);
      else setRefreshingPosts(true);

      const res = await fetch(`${JSON_SERVER_BASE_URL}/posts`);
      const data = await res.json();
      setPosts(data || []);
    } catch (err) {
      console.log('Error fetching posts:', err);
    } finally {
      setLoadingPosts(false);
      setRefreshingPosts(false);
    }
  };

  const toggleKeyword = keyword => {
    setSelectedKeywords(prev => {
      if (prev.includes(keyword)) return prev.filter(k => k !== keyword);
      return [...prev, keyword];
    });
  };

  const handleGenerateSummary = async () => {
    if (!question.trim()) return;

    setIsGenerating(true);
    setAiSummary('');

    try {
      const res = await fetch(`${AI_BASE_URL}/generate-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          keywords: selectedKeywords,
        }),
      });

      const data = await res.json();

      if (data?.answer) {
        const summaryText = data.answer;
        setAiSummary(summaryText);

        if (shareToCommunity) {
          await createPost(question.trim(), summaryText, selectedKeywords);
        }
      } else {
        setAiSummary('The AI did not return a summary. Try again.');
      }
    } catch (err) {
      console.log('AI error:', err);
      setAiSummary('There was a problem talking to the AI service.');
    } finally {
      setIsGenerating(false);
    }
  };

  const createPost = async (questionText, summaryText, keywords) => {
    try {
      const res = await fetch(`${JSON_SERVER_BASE_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'You',
          question: questionText,
          summary: summaryText,
          keywords: keywords || [],
        }),
      });

      const newPost = await res.json();

      if (newPost?.id) {
        setPosts(prev => [newPost, ...prev]);
      }
    } catch (err) {
      console.log('Error creating post:', err);
    }
  };

  const handleVote = async (postId, delta) => {
    setVotingPostId(postId);

    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              upvotes: (post.upvotes || 0) + (delta === 1 ? 1 : 0),
              downvotes: (post.downvotes || 0) + (delta === -1 ? 1 : 0),
            }
          : post
      )
    );

    try {
      await fetch(`${JSON_SERVER_BASE_URL}/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
    } catch (err) {
      console.log('Vote error:', err);
    } finally {
      setVotingPostId(null);
    }
  };

  const handleChangeCommentText = (postId, text) => {
    setCommentTextMap(prev => ({ ...prev, [postId]: text }));
  };

  const handleSubmitComment = async postId => {
    const text = (commentTextMap[postId] || '').trim();
    if (!text) return;

    setSubmittingCommentId(postId);

    try {
      const res = await fetch(`${JSON_SERVER_BASE_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: 'You', text }),
      });

      const newComment = await res.json();

      if (newComment?.id) {
        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? { ...post, comments: [...(post.comments || []), newComment] }
              : post
          )
        );
        setCommentTextMap(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.log('Comment error:', err);
    } finally {
      setSubmittingCommentId(null);
    }
  };

  const renderKeywordPill = keyword => {
    const isSelected = selectedKeywords.includes(keyword);
    return (
      <TouchableOpacity
        key={keyword}
        style={[styles.keywordPill, isSelected && styles.keywordPillSelected]}
        onPress={() => toggleKeyword(keyword)}
      >
        <Text style={[styles.keywordText, isSelected && styles.keywordTextSelected]}>
          {keyword}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPostItem = ({ item }) => {
    const comments = item.comments || [];
    const commentText = commentTextMap[item.id] || '';

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Text style={styles.postAuthor}>{item.author}</Text>
          <Text style={styles.postMeta}>
            {item.keywords?.length ? item.keywords.join(' • ') : 'General'}
          </Text>
        </View>

        <Text style={styles.postQuestion}>{item.question}</Text>

        {item.summary ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Quick AI Summary</Text>
            <Text style={styles.summaryText}>{item.summary}</Text>
          </View>
        ) : null}

        <View style={styles.postFooter}>
          <View style={styles.voteRow}>
            <TouchableOpacity style={styles.voteButton} onPress={() => handleVote(item.id, 1)}>
              <Text style={styles.voteButtonText}>▲</Text>
            </TouchableOpacity>

            <Text style={styles.voteCount}>
              {item.upvotes || 0} up • {item.downvotes || 0} down
            </Text>

            <TouchableOpacity style={styles.voteButton} onPress={() => handleVote(item.id, -1)}>
              <Text style={styles.voteButtonText}>▼</Text>
            </TouchableOpacity>

            {votingPostId === item.id && <ActivityIndicator size="small" color="#3A4B8E" />}
          </View>

          <Text style={styles.commentCount}>
            {comments.length} comment{comments.length === 1 ? '' : 's'}
          </Text>
        </View>

        {comments.length > 0 && (
          <View style={styles.commentsContainer}>
            {comments.slice(0, 2).map(comment => (
              <View key={comment.id} style={styles.commentRow}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={text => handleChangeCommentText(item.id, text)}
          />

          <TouchableOpacity
            style={styles.commentSendButton}
            onPress={() => handleSubmitComment(item.id)}
            disabled={submittingCommentId === item.id}
          >
            {submittingCommentId === item.id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.commentSendText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>Student</Text>
          <Text style={styles.headerSubText}>
            Ask a question, get an AI summary, then see how others are thinking about similar paths.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ask your question</Text>

          <TextInput
            style={styles.questionInput}
            placeholder="Type your career or college question here..."
            value={question}
            onChangeText={setQuestion}
            multiline
          />

          <Text style={styles.subLabel}>Focus keywords</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.keywordRow}
          >
            {KEYWORD_OPTIONS.map(renderKeywordPill)}
          </ScrollView>

          <View style={styles.shareRow}>
            <TouchableOpacity
              style={[styles.checkbox, shareToCommunity && styles.checkboxChecked]}
              onPress={() => setShareToCommunity(prev => !prev)}
            >
              {shareToCommunity && <Text style={styles.checkboxInner}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.shareLabel}>Share this as a community post</Text>
          </View>

          <StyledButton
            title={isGenerating ? <ActivityIndicator color="#FFFFFF" /> : 'Generate Summary'}
            onPress={handleGenerateSummary}
            styleType="primary"
          />

          {aiSummary ? (
            <View style={styles.aiSummaryBox}>
              <Text style={styles.summaryTitle}>Quick AI Summary</Text>
              <Text style={styles.summaryText}>{aiSummary}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.feedHeaderRow}>
          <Text style={styles.sectionTitle}>Community posts</Text>

          <TouchableOpacity onPress={fetchPosts}>
            {refreshingPosts ? (
              <ActivityIndicator size="small" color="#3A4B8E" />
            ) : (
              <Text style={styles.refreshText}>Refresh</Text>
            )}
          </TouchableOpacity>
        </View>

        {loadingPosts ? (
          <View style={styles.loadingPostsContainer}>
            <ActivityIndicator size="large" color="#3A4B8E" />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={item => String(item.id)}
            renderItem={renderPostItem}
            scrollEnabled={false}
            contentContainerStyle={styles.postsList}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666666',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 4,
  },
  headerSubText: {
    fontSize: 14,
    color: '#777777',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
    marginBottom: 6,
  },
  questionInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  keywordRow: {
    paddingVertical: 4,
  },
  keywordPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  keywordPillSelected: {
    backgroundColor: '#3A4B8E',
    borderColor: '#3A4B8E',
  },
  keywordText: {
    fontSize: 13,
    color: '#333333',
  },
  keywordTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3A4B8E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#3A4B8E',
  },
  checkboxInner: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  shareLabel: {
    fontSize: 14,
    color: '#333333',
  },
  aiSummaryBox: {
    marginTop: 16,
    backgroundColor: '#F0F2FF',
    borderRadius: 10,
    padding: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3A4B8E',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#333333',
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshText: {
    fontSize: 14,
    color: '#3A4B8E',
    fontWeight: 'bold',
  },
  loadingPostsContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  postsList: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 14,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  postMeta: {
    fontSize: 12,
    color: '#777777',
  },
  postQuestion: {
    fontSize: 15,
    color: '#222222',
    marginBottom: 8,
  },
  summaryBox: {
    backgroundColor: '#F8F8FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voteButtonText: {
    fontSize: 16,
    color: '#3A4B8E',
  },
  voteCount: {
    fontSize: 13,
    color: '#555555',
    marginHorizontal: 4,
  },
  commentCount: {
    fontSize: 13,
    color: '#777777',
  },
  commentsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 8,
  },
  commentRow: {
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },
  commentText: {
    fontSize: 12,
    color: '#555555',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#000000',
    marginRight: 8,
  },
  commentSendButton: {
    backgroundColor: '#3A4B8E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentSendText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default HomeScreen;

