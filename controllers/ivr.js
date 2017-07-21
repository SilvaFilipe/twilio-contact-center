const twilio = require('twilio')

/* client for Twilio TaskRouter */
const taskrouterClient = new twilio.TaskRouterClient(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN,
	process.env.TWILIO_WORKSPACE_SID)

module.exports.welcome = function (req, res) {
	let twiml = new twilio.TwimlResponse()

	let keywords = []

	/* add the team names as hints to the automatic speech recognition  */
	for (let i = 0; i < req.configuration.ivr.options.length; i++) {  //quantidade de equipas
		keywords.push(req.configuration.ivr.options[i].friendlyName)  //nome da equipa, i é a opçao (-1)
	}

	twiml.gather({
		input: 'dtmf speech',
		action: 'select-team',
		method: 'GET',
		numDigits: 1,
		timeout: 4,
		language: 'en-us',
		hints: keywords.join()
	}, function (node) {
		//node.say(req.configuration.ivr.text)
		
		/*if(req.configuration.ivr.options[0].friendlyName=='Sales'){
			twiml.play("http://demo.twilio.com/hellomonkey/monkey.mp3")
		}else{twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/selecao_invalida.mp3")}*/

		twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/marque_numero.mp3")
		twiml.pause({length: 2})

		/*for(escolha=0; escolha < req.configuration.ivr.options.length; escolha++ ){
		twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/marque.mp3")

				if(escolha==0){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/um.mp3")
				}else if(escolha==1){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/dois.mp3")
				}else if(escolha==2){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/tres.mp3")
				}else if(escolha==3){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/quatro.mp3")
				}else if(escolha==4){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/cinco.mp3")
				}

				twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/para.mp3")

				if(req.configuration.ivr.options[escolha].friendlyName=='Sales'){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/vendas.mp3")
				}else if(req.configuration.ivr.options[escolha].friendlyName=='Support'){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/suporte.mp3")
				}else if(req.configuration.ivr.options[escolha].friendlyName=='Marketing'){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/marketing.mp3")
				}

		}*/

	})

	twiml.say('You did not say anything or enter any digits.')
	//twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/nao_marcou.mp3")
	twiml.pause({length: 2})
	twiml.redirect({method: 'GET'}, 'welcome')

	res.setHeader('Content-Type', 'application/xml')
	res.setHeader('Cache-Control', 'public, max-age=0')
	res.send(twiml.toString())
}

let analyzeKeypadInput = function (digits, options) {

	for (let i = 0; i < options.length; i++) {
		if (parseInt(digits) === options[i].digit) {
			return options[i]
		}
	}

	return null
}

let analyzeSpeechInput = function (text, options) {

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
		console.log(req.query.SpeechResult)
		team = analyzeSpeechInput(req.query.SpeechResult, req.configuration.ivr.options)
	}

	if (req.query.Digits) {
		team = analyzeKeypadInput(req.query.Digits, req.configuration.ivr.options)
	}

	var twiml = new twilio.TwimlResponse()

	/* the caller pressed a key that does not match any team */
	if (team === null) {
		// redirect the call to the previous twiml
		twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/selecao_invalida.mp3")
		//twiml.say('Your selection was not valid, please try again')
		twiml.pause({length: 2})
		twiml.redirect({ method: 'GET' }, 'welcome')
	} else {
		twiml.gather({
			action: 'create-task?teamId=' + team.id + '&teamFriendlyName=' + encodeURIComponent(team.friendlyName),
			method: 'GET',
			numDigits: 1,
			timeout: 5
		}, function (node) {
			node.say('Press a key if you want a callback from ' + team.friendlyName + ', or stay on the line')

			/*
			twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/pressione_volta.mp3")

			if(team.friendlyName=='Sales'){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/vendas.mp3")
				}else if(team.friendlyName=='Support'){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/suporte.mp3")
				}else if(team.friendlyName=='Marketing'){
					twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/marketing.mp3")
				}
			twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/continue.mp3")
			
			*/
		})

		/* create task attributes */
		var attributes = {
			text: 'Caller answered IVR with option "' + team.friendlyName + '"',
			channel: 'phone',
			phone: req.query.From,
			name: req.query.From,
			title: 'Inbound call',
			type: 'inbound_call',
			team: team.id
		}

		twiml.enqueue({ workflowSid: req.configuration.twilio.workflowSid }, function (node) {
			node.task(JSON.stringify(attributes), {
				priority: 1,
				timeout: 3600
			})
		})

	}

	res.setHeader('Content-Type', 'application/xml')
	res.setHeader('Cache-Control', 'public, max-age=0')
	res.send(twiml.toString())
}

module.exports.createTask = function (req, res) {
	/* create task attributes */
	var attributes = {
		text: 'Caller answered IVR with option "' + req.query.teamFriendlyName + '"',
		channel: 'phone',
		phone: req.query.From,
		name: req.query.From,
		title: 'Callback request',
		type: 'callback_request',
		team: req.query.teamId
	}

	taskrouterClient.workspace.tasks.create({
		WorkflowSid: req.configuration.twilio.workflowSid,
		attributes: JSON.stringify(attributes)
	}, function (err, task) {

		var twiml = new twilio.TwimlResponse()

		if (err) {
			console.log(err)
			twiml.say('An application error occured, the demo ends now')
			//twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/erro.mp3")
		}  else {
			twiml.say('Thanks for your callback request, an agent will call you back a soon.')
			//twiml.play("https://secure2.domdigital.pt/domdigital/micael/mp3/obrigado_pedido.mp3")
			twiml.hangup()
		}

		res.setHeader('Content-Type', 'application/xml')
		res.setHeader('Cache-Control', 'public, max-age=0')
		res.send(twiml.toString())
	})

}
