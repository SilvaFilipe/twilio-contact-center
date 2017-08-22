var callcenterApplication = angular.module('callcenterApplication', []);

callcenterApplication.directive('setFocus', function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('click', function() {
        //alert(element.attr('id'));
        document.querySelector('#' + attrs.setFocus).focus();
      })
    }
  }
})