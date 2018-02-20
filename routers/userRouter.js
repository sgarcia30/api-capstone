'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const uuivd1 = require('uuid');
const {User} = require('../models/userModel');

const router = express.Router();

// do I need this line of code?
const jsonParser = bodyParser.json();


router.use(bodyParser.json());

router.get('/', (req, res) => {
	return User.find()
	  .then(users => res.json(users.map(user => user.serialize())))
	  .catch(err => res.status(500).json({
	  	message: 'Internal server error'
	  }));
});

router.put('/list', (req, res) => {
	const list = {
		    title: req.body.title,
			date: req.body.date,
			category: req.body.category,
			listId: uuivd1()
	};

	User.update(
	    { _id: req.body.userId }, 
	    { $push: { lists: list} }
	)
	.then( (updatedData) => {
		console.log(updatedData)
		res.json(updatedData);
	})
	.catch(err => {
		res.json(err);
	})
});

router.post('/list/build', (req, res) => {
	User
	.findOneAndUpdate({_id: req.body.userId, 'lists.title': req.body.listTitle},
		{$push: {"items": req.body.val}},
		{new: true})
	.then(user => {
		console.log(user)
		res.status(200).json(user)
	})
	.catch(err => {
		console.log(err)
		res.status(500)
	})
})

router.get('/:userId/list', (req, res) => {
	User
	.findOne({_id: req.params.userId})
	.then(user => {
		console.log(user);
		res.json(user);
	})
})

router.post('/calendar', (req, res) => {
	const event = {
		    name: req.body.name,
			date: req.body.date,
			startTime: req.body.startTime,
			endTime: req.body.endTime,
			eventId: uuivd1()
	};

	User
	.findOneAndUpdate({_id: req.body.userId},
		{$push: {events: event}},
		{new: true})
	.then(user => {
		console.log(user)
		res.status(200).json(user)
	})
	.catch(err => {
		console.log(err)
		res.status(500)
	})
})

module.exports = {router};