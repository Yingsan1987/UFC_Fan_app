const express = require('express');
const Forum = require('../models/Forum');
const ForumComment = require('../models/ForumComment');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Create forum
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const forumData = {
      title,
      content,
      author: req.user ? req.user.displayName : (author || 'Anonymous'),
    };
    
    // Add user info if authenticated
    if (req.user) {
      forumData.authorUid = req.user.uid;
      forumData.authorPhotoURL = req.user.photoURL;
    }
    
    const forum = await Forum.create(forumData);
    res.status(201).json(forum);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List forums (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Forum.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Forum.countDocuments(),
    ]);

    res.json({
      forums: items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page * limit < total,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Like a forum (one like per user)
router.post('/:id/like', optionalAuth, async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.status(404).json({ error: 'Forum not found' });
    
    const userId = req.user ? req.user.uid : req.body.guestId || 'guest';
    
    // Check if user already liked
    if (forum.likedBy.includes(userId)) {
      // Unlike - remove user from likedBy array
      const updated = await Forum.findByIdAndUpdate(
        req.params.id,
        { 
          $pull: { likedBy: userId },
          $inc: { likes: -1 }
        },
        { new: true }
      );
      return res.json({ ...updated.toObject(), userLiked: false });
    } else {
      // Like - add user to likedBy array
      const updated = await Forum.findByIdAndUpdate(
        req.params.id,
        { 
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 }
        },
        { new: true }
      );
      return res.json({ ...updated.toObject(), userLiked: true });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get comments for a forum
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await ForumComment.find({ forumId: req.params.id })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add a comment to a forum
router.post('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { content, author } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.status(404).json({ error: 'Forum not found' });

    const commentData = {
      forumId: forum._id,
      content,
      author: req.user ? req.user.displayName : (author || 'Anonymous'),
    };
    
    // Add user info if authenticated
    if (req.user) {
      commentData.authorUid = req.user.uid;
      commentData.authorPhotoURL = req.user.photoURL;
    }

    const comment = await ForumComment.create(commentData);
    
    // Increment comment count on forum
    await Forum.findByIdAndUpdate(req.params.id, { $inc: { commentCount: 1 } });
    
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Like a comment (one like per user)
router.post('/:id/comments/:commentId/like', optionalAuth, async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    const userId = req.user ? req.user.uid : req.body.guestId || 'guest';
    
    // Check if user already liked
    if (comment.likedBy.includes(userId)) {
      // Unlike
      const updated = await ForumComment.findByIdAndUpdate(
        req.params.commentId,
        { 
          $pull: { likedBy: userId },
          $inc: { likes: -1 }
        },
        { new: true }
      );
      return res.json({ ...updated.toObject(), userLiked: false });
    } else {
      // Like
      const updated = await ForumComment.findByIdAndUpdate(
        req.params.commentId,
        { 
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 }
        },
        { new: true }
      );
      return res.json({ ...updated.toObject(), userLiked: true });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;




