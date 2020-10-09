const DB_API = require('../db/db_api.js');
const choice = require('./models/choice.js');

function getResultsByProlificId(prolificId, turnNum) {
    let choices = DB_API.findChoicesByID(prolificId, turnNum);
    let count = 0;
    for(var i = 0; i < choices.length; i++){
        if(choices[i].localeCompare(this.prolificId)){ 
            count += 1;
        }
        else{
            let tempPlayer = choices[i];
            let tempChoices = DB_API.findChoicesByID(prolificId, turnNum);
            for(var j = 0; j < tempChoices.length; j++){
                if(tempChoices[j].localeCompare(prolificId)){
                    count +=4;
                    //check if triple bonus
                    if(isTripleBonus(prolificId, tempPlayer, choices, tempChoices)){
                        count += 8;
                    }
                }
            }
        }  
    }
    return count * 10;
}

function isTripleBonus(prolificId, tempPlayer, choices, tempChoices) {
    if(tempChoices.length != choices.length){
        return false;
    }
    var i = 0;
    var j = 0;
    while(i < choices.length && j < choices.length){
        if(choices[i].localeCompare(prolificId) || choices[i].localeCompare(tempPlayer)){
            i++;
        }
        if(tempChoices[j].localeCompare(prolificId) || tempChoices[j].localeCompare(tempPlayer)){
            j++;
        }
        if( !choices[i].localeCompare(prolificId) && !choices[i].localeCompare(tempPlayer) 
        && !tempChoices[j].localeCompare(prolificId) && !tempChoices[j].localeCompare(tempPlayer)){
            if(choices[i].localeCompare(tempChoices[j])){
                return true;
            }
        }
    }
    return false;
}

module.exports = {
    getResultsByProlificId : getResultsByProlificId,
}