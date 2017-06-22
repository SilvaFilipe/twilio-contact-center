function TaskWaitingTime() {
  
  return function(value) {

    let minutes = Math.floor(value / 60);
   	let seconds = value - (minutes * 60);
    let hours = minutes/60;

    if (hours < 10){
      hours = '0' + hours;
    }

      if(hours>0){
      minutes=minutes-(hours*60);
     }

    if (minutes < 10){
      minutes = '0' + minutes;
    }

    if (seconds < 10){
      seconds = '0' + seconds;
    }

   return hours + ':' +minutes + ':' + seconds;
  };

}

angular
  .module('callcenterApplication')
  .filter('TaskWaitingTime', TaskWaitingTime)