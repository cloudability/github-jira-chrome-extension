'use strict';

var main;

// messages from elsewhere! (probably background.js)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.onHistoryStateUpdated === true) {
    sendResponse({heardOnHistoryStateUpdated: true});
    main();
  }
});

$(function() {
  // place to stuff globals
  var global = {
    labelWasChanged: false,
    labelText: 'Code Review Passed'
  };

  var mergeHasHappend = false,
      issueStatusHasChanged = false,
      isPullRequest,
      isBranchCompare,
      checkPageLocation,
      issueNumbers = [];

  // we have to re-check on pushState :/
  checkPageLocation = function() {
    // reset
    isPullRequest = false;
    isBranchCompare = false;

    // if the div exists, assume we are on the pull request page
    if ($('.pull-request-tab-content').length > 0) {
      isPullRequest = true;
    }

    // we're on the comparison page which has the 'create pull request button'
    if (window.location.search === '?expand=1') {
      isBranchCompare = true;
    }
  };

  // helper function
  var unique = function(array){
    return array.filter(function(el, index, arr) {
      return index === arr.indexOf(el);
    });
  };

  // figure out the JIRA issue numbers
  var parseIssueNumbers = function() {
    var matches = [],
        results = [];

    // look in the issue title
    matches = grepForIssueNumber($('.js-issue-title').text());
    if (matches.length) {
      results = results.concat(matches);
    }

    // the second occurance of a branch listing
    matches = grepForIssueNumber($('.current-branch').eq(1).text());
    if (matches.length) {
      results = results.concat(matches);
    }

    // timeline commits
    $('.timeline-commits a.message').each(function() {
      matches = grepForIssueNumber($(this).text());
      if (matches.length) {
        results = results.concat(matches);
      }
    });

    return unique(results);
  };

  var grepForIssueNumber = function(text) {
    return text.match(/(CA\-[\d]+)/g) || [];
  };

  var appendTransitionButtonDiv = function(issueNumber, transitionData) {
    transitionData = transitionData || [];
    var divContents, fullDiv, button, transitionId;

    divContents = '' +
        '<div class="branch-action branch-action-state-clean js-mergable-state">' +
          '<span class="mega-octicon octicon-git-pull-request branch-action-icon"></span>' +
          '<div class="branch-action-body">' +

            '<div class="branch-status">' +
              '<h2><a href="https://cloudability.atlassian.net/browse/' + issueNumber +'" target="_blank">' + issueNumber + '</a></h2>' +
              '<div style="float: right;">' +
                'Current Ticket Status: <strong><span class="js-jira-current-state"></span</strong>' +
              '</div>' +
              '<div class="clearfix">&nbsp;</div>' +
              '<div class="js-jira-issue-title issue-title"></div>' +
              '<button class="js-refresh-issue octicon octicon-sync minibutton"></button>' +
              '<div class="clearfix">&nbsp;</div>' +
            '</div>' +

            '<div class="merge-message js-jira-button-container">' +
              '<div style="clear: both; height: 0px;">&nbsp;</div>' +
            '</div><!-- /.merge-message -->' +
          '</div><!-- /.branch-action-body -->' +
        '</div><!-- /.branch-action -->';

    // the container. split apart so the contents can be used separately when re-rendered
    fullDiv = '' +
      '<div data-jira-issue="'+issueNumber+'" class="js-details-container jira merge-pr">' +
        divContents +
      '</div><!-- /.merge-pr -->';

    // re-rendering button
    if ($('[data-jira-issue="'+issueNumber+'"]').length) {

      $('[data-jira-issue="'+issueNumber+'"]')
        .off()
        .empty()
        .html(divContents);

    } else {
      // new button, full div
      $('.discussion-timeline-actions').append(fullDiv);
    }

    // render the buttons
    transitionData.forEach(function(transition) {
      button = '' +
        '<button class="button primary merge-branch-action js-jira-transition" type="button" data-jira-transition-id="' + transition.id + '">' +
          transition.name +
        '</button>';

      $('[data-jira-issue="'+issueNumber+'"]').find('.js-jira-button-container').prepend(button);
    });

    // listen for those button clicks, migrate the jira issue state
    $('[data-jira-issue="'+issueNumber+'"]').on('click', '.js-jira-transition', function(e) {
      transitionId = $(this).data('jiraTransitionId');

      e.preventDefault();

      if (transitionId && issueNumber) {
        $.ajax({
          type: 'POST',
          dataType: 'json',
          contentType: 'application/json',
          url: 'https://cloudability.atlassian.net/rest/api/2/issue/'+issueNumber+'/transitions',
          data: JSON.stringify({ 'transition': { 'id': transitionId }}),
          success: function() {

            issueStatusHasChanged = true;

            renderIssue(issueNumber);
          }
        });
      }

    });

    // refresh button
    $('[data-jira-issue="'+issueNumber+'"]').on('click', '.js-refresh-issue', function(e) {
      var issueNumber = $(this).closest('.js-details-container').data('jiraIssue');

      e.preventDefault();

      renderIssue(issueNumber);
    });

  };

  // wrapper around the ajax call
  var getIssue = function(issueNumber, cb) {
    $.ajax({
      type: 'GET',
      url: 'https://cloudability.atlassian.net/rest/api/2/issue/'+issueNumber
    }).done(function(data) {
      cb(data);
    }).error(function(data) {
      console.error('getIssue FACK!', issueNumber, data);
    });
  };

  var renderIssueStatus = function(issueNumber) {
    var $sel = $('[data-jira-issue="'+issueNumber+'"]');

    getIssue(issueNumber, function(data) {
      $sel.find('.js-jira-current-state').text(data.fields.status.name);
      $sel.find('.js-jira-issue-title').text(data.fields.summary);
    });

  };

  var renderIssueError = function(issueNumber, message) {
    var $sel = $('[data-jira-issue="'+issueNumber+'"]');

    $sel.find('.js-jira-current-state').text('Unknown');
    $sel.find('.js-jira-button-container').prepend(message);
  };

  var renderIssue = function(issueNumber) {
    // get possible transitions
    $.ajax({
      type: 'GET',
      url: 'https://cloudability.atlassian.net/rest/api/2/issue/'+issueNumber+'/transitions'
    }).done(function(data) {

      appendTransitionButtonDiv(issueNumber, data.transitions);
      renderIssueStatus(issueNumber);

    }).error(function(data) {

      appendTransitionButtonDiv(issueNumber);
      renderIssueError(issueNumber, JSON.parse(data.responseText).errorMessages.join(' '));

    });
  };

  // avoid making unneccesary api calls to JIRA
  var issuesNotYetRendered = function() {
    return $('.js-jira-button-container').length === 0;
  };

  // its the main function, stuff here all-the-things!
  main = function() {
    checkPageLocation();
    issueNumbers = parseIssueNumbers();

    // pull request page
    if (isPullRequest && issueNumbers.length && issuesNotYetRendered()) {
      // reset
      mergeHasHappend = false;

      issueNumbers.forEach(function(issueNumber) {

        renderIssue(issueNumber);

      });

    // attempt to auto-fill the PR title
    } else if (isBranchCompare) {

      // keeping it simple
      if (issueNumbers.length === 1) {

        getIssue(issueNumbers[0], function(data) {
          // insert into the input field
          $('#pull_request_title').val(issueNumbers[0] + ' - ' + data.fields.summary);
        });

      }
    }
  };


  main();


  // handlers, misc

  // label was added/removed
  $('.sidebar-labels .js-navigation-item').on('click', function() {
    if ($.trim($(this).text()) === global.labelText) {
      global.labelWasChanged = true;
    }
  });

  // prompt user if they go to merge a PR and the appropriate label is not found
  $('.merge-branch-action.js-details-target').on('click', function() {
    var passed = false;

    // look for our label
    $('.sidebar-labels .label').each(function() {
      if ($.trim($(this).text()) === global.labelText) {
        passed = true;
      }
    });

    if (passed !== true) {
      return confirm('The label "' + global.labelText + '" is not found. Are you sure?');
    }
  });

  // pr was merged
  $(document).on('submit', '.js-merge-pull-request', function() {
    // assume this went ok
    mergeHasHappend = true;

    // re-render all the stuffs
    main();
  });

  // prompt the user if they attempt to leave the page after a PR has been merged
  // but the issue status has not changed
  window.onbeforeunload = function () {

    // prompt if 'code review label' was changed but jira issue was not
    if (issueNumbers.length && isPullRequest && global.labelWasChanged && issueStatusHasChanged === false) {
      return 'The JIRA ticket(s) status hasn\'t changed, is that ok?';
    }

    if (issueNumbers.length && isPullRequest && mergeHasHappend && issueStatusHasChanged === false) {
      return 'The JIRA ticket(s) status didn\'t change, is that ok?';
    }
  };

});
