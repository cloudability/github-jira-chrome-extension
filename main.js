'use strict';
$(function() {
  var  mergeHasHappend = false,
      ticketStatusHasChanged = false,
      isPullRequest = false,
      isBranchCompare = false;

  // if the div exists, assume we are on the pull request page
  if ($('.pull-request-tab-content').length > 0) {
    isPullRequest = true;
  }

  // we're on the comparison page which has the 'create pull request button'
  if (window.location.search === '?expand=1') {
    isBranchCompare = true;
  }

  // helper function
  var unique = function(array){
    return array.filter(function(el, index, arr) {
      return index === arr.indexOf(el);
    });
  };

  // figure out the JIRA ticket numbers
  var parseTicketNumbers = function() {
    var matches = [],
        results = [];

    // look in the issue title
    matches = grepForTicketNumber($('.js-issue-title').text());
    if (matches.length) {
      results = results.concat(matches);
    }

    // the second occurance of a branch listing
    matches = grepForTicketNumber($('.current-branch').eq(1).text());
    if (matches.length) {
      results = results.concat(matches);
    }

    // timeline commits
    $('.timeline-commits a.message').each(function() {
      matches = grepForTicketNumber($(this).text());
      if (matches.length) {
        results = results.concat(matches);
      }
    });

    return unique(results);
  };

  var grepForTicketNumber = function(text) {
    return text.match(/(CA\-[\d]+)/g) || [];
  };

  var appendTransitionButtonDiv = function(ticketNumber, transitionData) {
    transitionData = transitionData || [];
    var divContents, fullDiv;

    divContents = '' +
        '<div class="branch-action branch-action-state-clean js-mergable-state">' +
          '<span class="mega-octicon octicon-git-pull-request branch-action-icon"></span>' +
          '<div class="branch-action-body">' +

            '<div class="branch-status">' +
              '<h2 style="float: left; margin: 0px;"><a href="https://cloudability.atlassian.net/browse/' + ticketNumber +'" target="_blank">' + ticketNumber + '</a></h2>' +
              '<div style="float: right;">' +
                'Current Ticket Status: <strong><span class="js-jira-current-state"></span</strong>' +
              '</div>' +
              '<div style="clear: both; height: 0px;">&nbsp;</div>' +
              '<div style="float: left" class="js-jira-ticket-title"></div>' +
              '<div style="clear: both; height: 0px;">&nbsp;</div>' +
            '</div>' +

            '<div class="merge-message js-jira-button-container">' +
              '<div style="clear: both; height: 0px;">&nbsp;</div>' +
            '</div><!-- /.merge-message -->' +
          '</div><!-- /.branch-action-body -->' +
        '</div><!-- /.branch-action -->';

    // the container. split apart so the contents can be used separately when re-rendered
    fullDiv = '' +
      '<div data-jira-ticket="'+ticketNumber+'" class="js-details-container jira merge-pr">' +
        divContents +
      '</div><!-- /.merge-pr -->';


    // re-rendering button
    if ($('[data-jira-ticket="'+ticketNumber+'"]').length) {
      $('[data-jira-ticket="'+ticketNumber+'"]')
        .off()
        .empty()
        .html(divContents);
    } else {
      // new button, full div
      $('.discussion-timeline-actions').append(fullDiv);
    }

    // render the buttons
    transitionData.forEach(function(transition) {
      var blah = '' +
              '<button class="button primary merge-branch-action js-jira-transition" type="button" data-jira-transition-id="' + transition.id + '">' +
                transition.name +
              '</button>';

      $('[data-jira-ticket="'+ticketNumber+'"]').find('.js-jira-button-container').prepend(blah);
    });

    // listen for those button clicks, migrate the ticket state
    $('[data-jira-ticket="'+ticketNumber+'"]').on('click', '.js-jira-transition', function(e) {
      e.preventDefault();
      var transitionId = $(this).data('jiraTransitionId');

      if (transitionId && ticketNumber) {
        $.ajax({
          type: 'POST',
          dataType: 'json',
          contentType: 'application/json',
          url: 'https://cloudability.atlassian.net/rest/api/2/issue/'+ticketNumber+'/transitions',
          data: JSON.stringify({ 'transition': { 'id': transitionId }}),
          success: function() {
            main();
            ticketStatusHasChanged = true;
          }
        });
      }

    });
  };

  // wrapper around the ajax call
  var getIssue = function(ticketNumber, cb) {
    $.ajax({
      type: 'GET',
      url: 'https://cloudability.atlassian.net/rest/api/2/issue/'+ticketNumber
    }).done(function(data) {
      cb(data);
    }).error(function(data) {
      console.error('getIssue FACK!', ticketNumber, data);
    });
  };

  var renderTicketStatus = function(ticketNumber) {

    getIssue(ticketNumber, function(data) {
      $('[data-jira-ticket="'+ticketNumber+'"]').find('.js-jira-current-state').text(data.fields.status.name);
      $('[data-jira-ticket="'+ticketNumber+'"]').find('.js-jira-ticket-title').text(data.fields.summary);
    });

  };

  var renderTicketError = function(ticketNumber, message) {
    $('[data-jira-ticket="'+ticketNumber+'"]').find('.js-jira-current-state').text('Unknown');
    $('[data-jira-ticket="'+ticketNumber+'"]').find('.js-jira-button-container').prepend(message);
  };

  // pr was merged
  $(document).on('click', '.commit-form-actions .primary:first', function() {
    // assume this went ok
    mergeHasHappend = true;
  });

  // prompt the user if they attempt to leave the page when a PR has been merged
  // but the ticket status has not changed
  window.onbeforeunload = function () {
    if (mergeHasHappend === true && ticketStatusHasChanged === false) {
      return 'The JIRA ticket(s) status didn\'t change, is that ok?';
    }
  };

  // its the main function, stuff here all-the-things!
  var main = function() {
    var ticketNumbers = parseTicketNumbers();

    // pull request page
    if (isPullRequest && ticketNumbers.length) {

      ticketNumbers.forEach(function(ticketNumber) {

        // get possible transitions
        $.ajax({
          type: 'GET',
          url: 'https://cloudability.atlassian.net/rest/api/2/issue/'+ticketNumber+'/transitions'
        }).done(function(data) {

          appendTransitionButtonDiv(ticketNumber, data.transitions);
          renderTicketStatus(ticketNumber);

        }).error(function(data) {

          appendTransitionButtonDiv(ticketNumber);
          renderTicketError(ticketNumber, JSON.parse(data.responseText).errorMessages.join(' '));

        });

      });

    // attempt to auto-fill the PR title
    } else if (isBranchCompare) {

      // keeping it simple
      if (ticketNumbers.length === 1) {

        getIssue(ticketNumbers[0], function(data) {
          // insert into the input
          $('#pull_request_title').val(ticketNumbers[0] + ' - ' + data.fields.summary);
        });

      }
    }
  };


  main();

  // spinner https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif

});
