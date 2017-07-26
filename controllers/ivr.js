const Twilio 	= require('twilio')

const taskrouterHelper = require('./helpers/taskrouter-helper.js')

module.exports.welcome = function (req, res) {
	const twiml =  new Twilio.twiml.VoiceResponse()

	let keywords = []

	/* add the team names as hints to the automatic speech recognition  */
	for (let i = 0; i < req.configuration.ivr.options.length; i++) { //quantidade de equipas
		keywords.push(req.configuration.ivr.options[i].friendlyName) //nome da equipa, i é a opçao (-1)
	}

	const gather = twiml.gather({
		input: 'dtmf speech',
		action: 'select-team',
		method: 'GET',
		numDigits: 1,
		timeout: 4,
		language: 'en-US',
		hints: keywords.join()
	})

		//gather.say(req.configuration.ivr.text)

		gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/marque_numero.mp3")
		gather.pause({length: 1})

		for(escolha=0; escolha < req.configuration.ivr.options.length; escolha++ ){
		gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/marque.mp3")

				if(escolha==0){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/um.mp3")
				}else if(escolha==1){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/dois.mp3")
				}else if(escolha==2){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/tres.mp3")
				}else if(escolha==3){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/quatro.mp3")
				}else if(escolha==4){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/cinco.mp3")
				}

				gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/para.mp3")

				if(req.configuration.ivr.options[escolha].friendlyName=='Sales'){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/vendas.mp3")
				}else if(req.configuration.ivr.options[escolha].friendlyName=='Support'){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/suporte.mp3")
				}else if(req.configuration.ivr.options[escolha].friendlyName=='Marketing'){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/marketing.mp3")
				}
				
		}

	//twiml.say('You did not say anything or enter any digits.')
	twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/nao_marcou.mp3")
	twiml.pause({length: 1})
	twiml.redirect({method: 'GET'}, 'welcome')

	res.send(twiml.toString())
}

var analyzeKeypadInput = function (digits, options) {

	for (let i = 0; i < options.length; i++) {
		if (parseInt(digits) === options[i].digit) {
			return options[i]
		}
	}

	return null
}

var analyzeSpeechInput = function (text, options) {

	for (let i = 0; i < options.length; i++) {
		if (text.toLowerCase().includes(options[i].friendlyName.toLowerCase())) {
			return options[i]
		}
	}

	return null
}

module.exports.selectTeam = function (req, res) {
	let team = null

	/* check if we got a dtmf input or a speech-to-text */
	if (req.query.SpeechResult) {
		console.log('SpeechResult: ' + req.query.SpeechResult)
		team = analyzeSpeechInput(req.query.SpeechResult, req.configuration.ivr.options)
	}

	if (req.query.Digits) {
		team = analyzeKeypadInput(req.query.Digits, req.configuration.ivr.options)
	}

	const twiml =  new Twilio.twiml.VoiceResponse()

	/* the caller pressed a key that does not match any team */
	if (team === null) {
		// redirect the call to the previous twiml
		//twiml.say('Your selection was not valid, please try again')
		twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/selecao_invalida.mp3")
		twiml.pause({length: 2})
		twiml.redirect({ method: 'GET' }, 'welcome')
	} else {

		const gather = twiml.gather({
			action: 'create-task?teamId=' + team.id + '&teamFriendlyName=' + encodeURIComponent(team.friendlyName),
			method: 'GET',
			numDigits: 1,
			timeout: 5
		})

		//gather.say('Press a key if you want a callback from ' + team.friendlyName + ', or stay on the line')
			gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/pressione_volta.mp3")
			if(team.friendlyName=='Sales'){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/vendas.mp3")
				}else if(team.friendlyName=='Support'){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/suporte.mp3")
				}else if(team.friendlyName=='Marketing'){
					gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/marketing.mp3")
				}
			
			gather.play("https://secure2.domdigital.pt/domdigital/micael/mp3/continue.mp3")

		/* create task attributes */
		const attributes = {
			text: 'Caller answered IVR with option "' + team.friendlyName + '"',
			channel: 'phone',
			phone: req.query.From,
			name: req.query.From,
			title: 'Inbound call',
			type: 'inbound_call',
			team: team.id
		}

		twiml.enqueueTask({
			workflowSid: req.configuration.twilio.workflowSid,
		}).task({priority: 1, timeout: 3600}, JSON.stringify(attributes));

	}

	res.send(twiml.toString())
}

module.exports.createTask = function (req, res) {
	/* create task attributes */
	const attributes = {
		text: 'Caller answered IVR with option "' + req.query.teamFriendlyName + '"',
		channel: 'phone',
		phone: req.query.From,
		name: req.query.From,
		title: 'Callback request',
		type: 'callback_request',
		team: req.query.teamId
	}

	const twiml =  new Twilio.twiml.VoiceResponse()

	taskrouterHelper.createTask(req.configuration.twilio.workflowSid, attributes)
		.then(task => {
			//twiml.say('Thanks for your callback request, an agent will call you back soon.')
			twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/obrigado_pedido.mp3")
			twiml.hangup()
		}).catch(error => {
			//twiml.say('An application error occured, the demo ends now')
			twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/erro.mp3")
		}).then(() => {
			res.send(twiml.toString())
		})

}
