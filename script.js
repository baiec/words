// JavaScript Document

var uuid = PUBNUB.uuid();
var pubnub = PUBNUB.init({
	publish_key: 'pub-c-ddc0bdfd-465e-4bbc-933e-32b10c2b784f',
	subscribe_key: 'sub-c-1b6a917e-cf6d-11e5-837e-02ee2ddab7fe',
	uuid: uuid,
	heartbeat: 10
});

/*
    Runs on startup, displays start modal
    n/a
    void
*/
(function(){
    "use strict";
    $("#startModal").modal({keyboard:false,backdrop:"static"}); //removes ability to close modal
    $("#startModal").modal("show");
    pubnub.subscribe({
		channel: gameChannel,
		presence: presence,
		message: handleMessage,
		state: {
			inGame:false
		}
	});
}());

var gameChannel = "testChannel5";


//arrays
var consonantArray = ["b","c","d","f","g","h","j","k","l","m","n","p","r","s","t","v","w","y"];
var vowelArray = ["a","e","i","o","u"];
var submittedWordsArray = [];

//containers
var wordAreaDiv = $("div#wordArea");
var startDiv = $("div#start");

var letterRow = $("#letterRow");
var chatUl = $("#chatUl");

var confirmWord = $("p#word");
var confirmBtn = $("#confirmBtn");
var error = $("#error");
var noOfPlayers = $("#noOfPlayers");
//buttons
var enterLobby = $("button#enterLobby");
var startGame = $("button#startGame");
var endGame = $("button#endGame");
var chatBtn = $("#publishMessageBtn");
//input
var chatInput = $("#chatInput");
//other
var inGame = false; //local state
var enteredgame = false;
var scores = []; //will contain arrays which have [name, letters]
var words = []; //user's words after clicking endgame, used to display them


/*
    publishes message from chatInput to testChannel3
    n/a
    void
*/
function pubChatMsg(){
    "use strict";
    if(chatInput.val().trim() !== ''){ //checks if blank or only containing whitespace
        pub(gameChannel,$("#usernameInput").val() + ": " +chatInput.val());
        chatInput.val(''); 
    }
}


/*
    test function to see the elements in an array
    array = whatever array you want to inspect
    n/a
*/
function logArrayContents(array){
	"use strict";
	for(var i=0;i<array.length;i++){
		console.log(array[i]);
	}
}


/*
	Will count how many letters you had
	global parameter "words"
	returns integer
*/
function getLetterAmount(){
	"use strict";
	var letters = 0;
	words = putWordsIntoArray(); //is array containing strings
	for(var i=0;i<words.length;i++){
		letters = letters + words[i].length;
		console.log(letters);
	}
	return letters;
}


/*
	Will calculate winner (who has the most letters)
	parameter m = player
	void
*/
function decideWinner(player){
	"use strict";
	scores.push(player);
    listWords(player);
	pubnub.here_now({
		channel: gameChannel,
		callback: function(m){
			if(scores.length === m.occupancy){
                var letters = [];
                var winners = [];
                var largest = 0;
				logArrayContents(scores);
				for(var i=0;i<scores.length;i++){
					letters.push(scores[i][1]);
				}
				largest = Math.max.apply(Math, letters);
				for(var e=0;e<scores.length;e++){
					if(largest === scores[e][1]){
						winners.push(scores[e][0] + " (" + scores[e][1] + ")");
					}
				}
				alert(winners.toString() + " has won!");
				scores.length = 0;
			}
		}
	});
}

function listWords(player){ // player[0] = username, player[1] = number of letters, player[2] = array of words
    "use strict";
    console.log("test");
    $("#wordArea").append("<div class='col-md-2 col-sm-2 end'><ul><li>"+player[0]+" ("+player[1]+"): </li></ul></div>");
    player[2].forEach(function(ele){
        $("#wordArea div:last ul").append("<li>"+ele+"</li>");
    });
}

/*
	ran when startgame is clicked, emptys previous letters and displays new ones
	m = the player
	void
*/
function handleLetters(m){ // [vowels, consonants] eaCH ITEM IS An array
	"use strict";
	letterRow.empty(); //I empty it here and not when ending the game so that people have the chance to see what other words they could make
	for(var i=0 ; i<4 ; i++){
        if(i === 0){
		    letterRow.append("<button class='btn btn-ltr btn-warning btn-lg'>"+m[1][i]+"</button>");
        } else {
            letterRow.append("<button class='btn btn-ltr btn-warning btn-lg'>"+m[1][i]+"</button>");
        }
        if(i !== 3){
            letterRow.append("<button class='btn btn-ltr btn-danger btn-lg'>"+m[0][i]+"</button>");
        }
	}
}


/*
	will collect words at end of round
	n/a
	returns array filled with words
*/
function putWordsIntoArray(){
	"use strict";
    var word = "";
	var noOfCol = $("#wordArea div").length;
	var array = [];
	for(var i=0;i<noOfCol;i++){
       word = $("#wordArea div:not(.end):first"); 
       array.push(word.text());
       word.remove();
	}
	return array;
}


/*
	Handles all pubnub presence related events, such as joining and state-changing (starting/ending games)
	m = the player
	void
*/
function presence(m){
	"use strict";
	console.log(m);
	if(m.action === "join"){
		if(uuid === m.uuid){ //only will run for the user who joined
			pubnub.here_now({
				channel: gameChannel,
				state: true,
				callback: function(m){
					var p = m.uuids;
					if(p[0].state.inGame && p[0].uuid !== uuid){
						throw new Error('This is not an error. This is just to abort javascript');
						/*pubnub.unsubscribe({
							channel: gameChannel,
							callback: alert("Game is in progress, you have been kicked, please refresh when game is finished")
						});*/
					}
				}
			});

		}
	}
	else if(m.action === "timeout" || m.action === "leave"){
	}
	else if(m.action === "state-change"){
		if(m.data.inGame && !inGame){ //someone clicked the startgane button and you are not in the game
			inGame = true;
            $("#wordArea").empty();
			pubnub.state({
				channel: gameChannel,
				state: {
					inGame: true
				},
				callback: function(m){console.log(m.inGame);}
			});
		}
		else if(!m.data.inGame && inGame){
			inGame = false;
			pubnub.state({
				channel: gameChannel,
				state: {
					inGame: false
				},
				callback: function(m){console.log(m.inGame);}
			});
			pub("endGameChannel",[$("#usernameInput").val(),getLetterAmount(),words]);
		}
	}
	noOfPlayers.html(m.occupancy + (m.occupancy === 1 ? " player" : " players"));	
}


/*
    Prepends published messages to chatUl
    message = what a player typed in the chatInput
    n/a
*/
function handleMessage(message){
	"use strict";
	chatUl.prepend("<li>"+message+"</li>");
}


/*
	short notation to publish messages
	channel = what channel to publish message to, message = what you want to send
	void
*/
function pub(channel, message){
	"use strict";
	pubnub.publish({
		channel: channel,
		message: message
	});
}


/*
	generates random consonants and vowels
	array = consonant array or vowel array, noOfElementsNeeded = how many of each type of letter (vowels 3, consonants 4)
	returns array with letters to be used in the game
*/
function generateRandomLetters(array,noOfElementsNeeded){ //noOfElementsNeeded = 3 or 4
		"use strict";
		var usedLetters = [];
		var successCount = 0;
		while(successCount < noOfElementsNeeded){
			var letter = array[Math.floor(Math.random()*array.length)];
			var successful = usedLetters.indexOf(letter) === -1; //boolean, checks if the generated letter has been generated before
			if(successful){
				usedLetters.push(letter);
				successCount++;
			}
		}
		return usedLetters;
}


/*
	checks and prevents the user from submitting a word below 3 letters
	n/a
	returns boolean
*/
function wordLengthAboveTwo(){
	"use strict";
	if((confirmWord.text()).length < 3){
		return false;
	} else {
		return true;
	}
}


/*
	checks and prevents the user from submitting a word they have already sumbitted
	n/a
	returns boolean
*/
function repeatWords(){
	"use strict";
	if(submittedWordsArray.indexOf(confirmWord.text()) === -1){
		return false;
	} else {
		return true;	
	}
}


function realWord(){
    "use strict";
    if(dict.indexOf(confirmWord.text()) !== -1){
        return true;
    } else {
        return false;
    }
}

// event handlers

/*
    If join button is clicked and username isnt blank, hide modal
    n/a
    void
*/
enterLobby.click(function(){
    "use strict";
    if($("#usernameInput").val().trim() !== ""){
        $("#startModal").modal("hide");
    } else {
        $("#startModalError").text("Username is blank.");
    }
});


/*
    If enter key is clicked and username isnt blank, hide modal
    n/a
    void
*/
$("#usernameInput").keypress(function(key){
   "use strict";
   if(key.which === 13){
       enterLobby.click();   
   }
});


/* 
	Will generate letters and change state to ingame
	No parameters
	Void
*/
startGame.click(function(){
	"use strict";
	var vowels = generateRandomLetters(vowelArray, 3);
	var consonants = generateRandomLetters(consonantArray, 4);
    $("#wordArea").empty();
	inGame = true;
	//start timer
	pub("letters",[vowels, consonants]);
	pubnub.state({
		channel: gameChannel,
		state: {
			inGame: true
		},
		callback: function(m){console.log(m.inGame);}
	});
});


/*
	Will set ingame state to false and submit score
	N/A
	Void
*/

endGame.click(function(){ //will make all players end game
	"use strict";
	if (inGame)
		confirmWord.html('');
	    
		inGame = false;
		pubnub.state({
			channel: gameChannel,
			state: {
				inGame: false
			},
			callback: function(m){console.log(m.inGame);}
		});
		pub("endGameChannel",[$("#usernameInput").val(),getLetterAmount(),words]); //[username,integer,[words]]
	    submittedWordsArray.length = 0;
	}
});


/*
	Will hide the username div
	n/a
	void
*/

enterLobby.click(function(){
	"use strict";
	//testChannel3
	startDiv.css("display", "none");
});


/*
	handles all the cases when the user clicks the letter buttons; letters clicked will be added to current word
	n/a
	void
*/

$(document).on('click', '#letterRow button', function(){
	"use strict";
	if(!inGame){
		error.text("The buttons don't work outside of game.");
	} 
	else {
		confirmWord.append($(this).text());
	}
});


/*
	handles all cases when user clicks the submit word button; appends current word to table
	n/a
	void
*/
confirmBtn.click(function(){
	"use strict";
	if(wordLengthAboveTwo()){
		if(!repeatWords()){
            if(realWord()){
                $("#wordArea").append('<div class="col-md-2 col-sm-2 wordAreaCol">'+confirmWord.text()+'</div>');
                submittedWordsArray.push(confirmWord.text());
                confirmWord.text('');
                error.text('');
            } else {
                error.text("That isn't an English word.");
            }
		} else {
			error.text("You cannot submit two of the same word.");
		}
	} else {
		error.text("Your word has to be above two letters in length.");
	}
});


/*
	when current word is clicked, it is deleted
	n/a
	void
*/
$(document).on('click', 'p#word', function(){
	"use strict";
	confirmWord.text('');
});


/*
    publishes message from chatInput when enter key is pressed
    e = key pressed
    void
*/
chatInput.keypress(function(e){
    "use strict";
    if(e.which === 13){ //13 === enter
        pubChatMsg();
    }
});


/*
    publishes message from chatInput when post button is clicked
    n/a
    void
*/
chatBtn.click(function(){
    "use strict";
    pubChatMsg();
});

/*pubnub.subscribe({
	channel: gameChannel,
	presence: presence,
	message: handleMessage,
	state: {
		inGame:false
	}
}); //"normal" (presence and chat)*/


pubnub.subscribe({
	channel: "letters",
	message: handleLetters
}); //for handling start of game


pubnub.subscribe({
	channel: "endGameChannel",
	message: decideWinner
});


