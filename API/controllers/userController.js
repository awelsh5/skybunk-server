const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const {jwtSecret} = require('../config/secrets');
const {verifyToken} = require('../helpers/authorization');
const router = express.Router();

require('../models/User');
const User = mongoose.model('User');

require('../models/GoldenTicket');
const GoldenTicket = mongoose.model('GoldenTicket');

// Return all users
router.get('/', (req, res) => {
	User.find().select('-password').then(users => {
		res.json(users);
	});
});

// Get specific user
router.get('/user/:id', (req, res) => {
	User.findOne({_id: req.params.id}).select('-password').then(user => {
		res.json(user);
	}).catch(err => {
		res.json(err);
	});
});

// Creates a user -- Protect this route with `golden ticket`
router.post('/', (req, res) => {
	GoldenTicket.verifyTicket(req.body.goldenTicket).then(result => {
		if (result) {
			User.create(req.body).then(user => {
				res.json(user);
			}).catch(err => {
				res.json(err);
			});
		}
		else {
			res.status(400).json({message: 'No valid golden ticket provided'});
		}
	}).catch(err => {
		res.json(err);
	});
});

// Deletes a user
router.delete('/:id', verifyToken, (req, res) => {
	if(req.params.id !== req.user._id) {
		res.status(403);
	}
	else {
		User.deleteOne({_id: req.params.id})
		.then(() => {
			res.status(200).send('success');
		}).catch(err => {
			res.status(404).json(err);
		});
	}
});

// Updates logged in user
router.put('/:id', verifyToken, (req, res) => {
	if(req.params.id !== req.user._id) {
		res.status(403);
	}

	User.findOne({_id: req.user._id}).then(user => {
		user.update(req.body).then(user => {
			res.json(user);
		}).catch(err => {
			res.json(err);
		});
	}).catch(err => {
		res.status(404).json(err);
	});
});

// Changes a user password
router.post('/:id/password', verifyToken, (req, res) => {
	if(req.params.id !== req.user._id) {
		res.status(403);
	}

	User.findOne({_id: req.user._id}).then(user => {
		user.changePassword(req.body.password).then(password => {
			res.json(password);
		}).catch(err => {
			res.json(err);
		});
	}).catch(err => {
		res.status(404).json(err);
	});
});

// Get the logged in user
router.get('/loggedInUser', verifyToken, (req, res) => {
	res.json(req.user);
})

// Login a user
router.post('/login', (req, res) => {
	User.authenticate(req.body.username, req.body.password).then(user => {
		jwt.sign({user: user}, jwtSecret, (err, token) => {
			res.json({token});
		});
	}).catch(err => {
		res.json({err: err});
	});
});

module.exports = router;