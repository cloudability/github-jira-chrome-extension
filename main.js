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
    labelText: 'Code Review Passed',
    issueStatusHasChanged: false,
    isPullRequest: false,
    issueNumbers: [],
    isBranchCompare: false
  };
  var checkPageLocation;

  // we have to re-check on pushState :/
  checkPageLocation = function() {
    // reset
    global.isPullRequest = false;
    global.isBranchCompare = false;

    // if the div exists, assume we are on the pull request page
    if ($('.pull-request-tab-content').length > 0) {
      global.isPullRequest = true;
    }

    // we're on the comparison page which has the 'create pull request button'
    if (window.location.search === '?expand=1') {
      global.isBranchCompare = true;
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

            '<div class="status">' +
              '<div class="table-row">' +
                '<div class="table-cell">' +
                  '<h2><a href="https://cloudability.atlassian.net/browse/' + issueNumber +'" target="_blank">' + issueNumber + '</a></h2>' +
                '</div>' +
                '<div class="table-cell assignee js-jira-assignee"></div>' +
                '<div class="table-cell"><strong><span class="js-jira-current-state current-state"></span></strong></div>' +
                '<div class="table-cell"><button class="js-refresh-issue octicon octicon-sync minibutton"></button></div>' +
              '</div>' +
              '<div class="table-row">' +
                '<span class="js-jira-issue-title issue-title"></span>' +
              '</div>' +
            '</div>' +

            '<div class="js-button-slider-container slider-container"><span class="octicon octicon-chevron-down"></span></div>' +
            '<div class="button-container js-jira-button-container" style="display: none;">' +
              '<div style="clear: both; height: 0px;">&nbsp;</div>' +
            '</div><!-- /.button-container -->' +
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
        '<button class="button minibutton primary merge-branch-action js-jira-transition" type="button" data-jira-transition-id="' + transition.id + '">' +
          transition.name +
        '</button>';

      $('[data-jira-issue="'+issueNumber+'"]').find('.js-jira-button-container').prepend(button);
    });

    // listen for those button clicks, migrate the jira issue state
    $('[data-jira-issue="'+issueNumber+'"]').on('click', '.js-jira-transition', function(e) {
      transitionId = $(this).data('jiraTransitionId');

      e.preventDefault();

      if (transitionId && issueNumber) {

        addSpinner(issueNumber);

        $.ajax({
          type: 'POST',
          dataType: 'json',
          contentType: 'application/json',
          url: 'https://cloudability.atlassian.net/rest/api/2/issue/'+issueNumber+'/transitions',
          data: JSON.stringify({ 'transition': { 'id': transitionId }}),
          success: function() {

            global.issueStatusHasChanged = true;

            renderIssue(issueNumber);
          }
        });
      }

    });

    // slider to open the buttons
    $('[data-jira-issue="'+issueNumber+'"]').on('click', '.js-button-slider-container', function(e) {
      e.preventDefault();
      $(this).siblings('.js-jira-button-container').slideDown(100);
      $(this).remove();
    });

    // refresh button
    $('[data-jira-issue="'+issueNumber+'"]').on('click', '.js-refresh-issue', function(e) {
      var issueNumber = $(this).closest('.js-details-container').data('jiraIssue');

      e.preventDefault();

      addSpinner(issueNumber);

      renderIssue(issueNumber);
    });

  };

  // wrapper around the ajax call
  var getIssue = function(issueNumber) {
    return $.ajax({
      type: 'GET',
      url: 'https://cloudability.atlassian.net/rest/api/2/issue/'+issueNumber+'?expand=transitions'
    });
  };

  var addSpinner = function(issueNumber) {
    var $sel = $('[data-jira-issue="'+issueNumber+'"]').find('.branch-action-body');

    var tmpl = ''+
      '<div class="spinner-background">' +
        '<div class="spinner-container">' +
          '<div style="margin: 0 auto; display: table; height: 100%;">' +
            '<span class="spinner-icon octicon mega-octicon octicon-hourglass" style="display: table-cell; vertical-align: middle;"></span>' +
          '</div>' +
        '</div>' +
      '</div>';

    $sel.append(tmpl);
  };

  var renderIssueError = function(issueNumber, message) {
    var $sel = $('[data-jira-issue="'+issueNumber+'"]');

    $sel.find('.js-jira-current-state').text('Unknown');
    $sel.find('.js-jira-button-container').prepend(message);
  };

  var renderIssue = function(issueNumber) {
    var avatarUrl, assignee, $sel;

    getIssue(issueNumber).done(function(data) {

      appendTransitionButtonDiv(issueNumber, data.transitions);

      $sel = $('[data-jira-issue="'+issueNumber+'"]');

      $sel.find('.js-jira-current-state').text(data.fields.status.name);

      // status color
      if (data.fields.status && data.fields.status.statusCategory) {
        $sel.find('.js-jira-current-state').addClass(data.fields.status.statusCategory.colorName);
      }

      $sel.find('.js-jira-issue-title').text(data.fields.summary);

      // assignee stuffs
      if (data.fields.assignee) {
        assignee = data.fields.assignee.displayName;
        avatarUrl = data.fields.assignee.avatarUrls['24x24'];

      } else if (data.fields.assignee === null) {
        assignee = 'Unassigned';
        avatarUrl = 'https://cloudability.atlassian.net/secure/useravatar?size=small&avatarId=10123';
      }

      if (assignee && avatarUrl) {
        $sel.find('.js-jira-assignee').text(assignee);
        $sel.find('.js-jira-assignee').prepend('<img src="'+avatarUrl+'">');
      }

    }).error(function(data) {
      console.error('getIssue FACK!', issueNumber, data);

      // does this occur anymore?
      //renderIssueError(issueNumber, JSON.parse(data.responseText).errorMessages.join(' '));

    });
  };

  // avoid making unneccesary api calls to JIRA
  var issuesNotYetRendered = function() {
    return $('.js-jira-button-container').length === 0;
  };

  // its the main function, stuff here all-the-things!
  main = function() {
    checkPageLocation();
    global.issueNumbers = parseIssueNumbers();

    // pull request page
    if (global.isPullRequest && global.issueNumbers.length && issuesNotYetRendered()) {

      global.issueNumbers.forEach(function(issueNumber) {

        renderIssue(issueNumber);

      });

    // attempt to auto-fill the PR title
    } else if (global.isBranchCompare) {

      // keeping it simple
      if (global.issueNumbers.length === 1) {

        getIssue(global.issueNumbers[0]).done(function(data) {
          // insert into the input field
          $('#pull_request_title').val(global.issueNumbers[0] + ' - ' + data.fields.summary);
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

  // prompt if someone tries to merge a PR with a failing build
  $('.merge-branch-action.js-details-target').on('click', function() {
    if ($('.branch-status').find('.octicon-x').length === 1) {
      return confirm('The build is failing!! Are you sure?');
    }
  });

});
