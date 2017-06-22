function TaskWaitingTime() {
  
  return function(value) {

    let minutes = Math.floor(value / 60);
   	let seconds = value - (minutes * 60);
    let hours = minutes/60;
    let minutes1=minutes;

    if (hours < 10){
      hours = '0' + hours;
    }

    if (minutes < 10){
      minutes = '0' + minutes;
    }

     if (minutes1 >= 60){
      minutes1 = minutes%60;
    }

    if (minutes1 < 10){
      minutes1 = '0' + minutes1;
    }

    if (seconds < 10){
      seconds = '0' + seconds;
    }

   return hours + ':' + minutes1 + ':' + seconds;
  };

}

angular
  .module('callcenterApplication')
  .filter('TaskWaitingTime', TaskWaitingTime)