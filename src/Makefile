### Makefile for Inferno apps
#
# Targets:
#	publish	push to GitHub
#	serve	serve on localhost (with drafts)
#	build	build the site
#	imports	copy in files from outside the tree
#

PROD_BRANCH = prod

# This really wants to be better parametrized.
#	Note:  rsync ../build to its parent directory.
UPLOAD_TO = savitzky.net:vv/prj/hyperviewer

BUILD_DIR = $(wildcard ../build build)
SERVER_GLOB = '[s]cripts/start'

###
SHELL=/bin/bash

# TARGETS has all of the targets a user is likely to make
#	  there are some internal ones not listed here.
TARGETS = production serve build github upload test

all::
	@echo targets: $(TARGETS)
	@echo usage:  'make draft name=SLUG title="TITLE"; edit; make post'

.PHONY:  $(TARGETS) report-vars kill-server

### Building

# If the test server is running, you may need to stop it before building.  Otherwise
#	it can clobber the build if it notices that something has changed.  This isn't
#	a problem with React or Inferno, but it is with Jekyll.  Eventually it needs
#	to be parametrized.
#
SERVER_PID = $(firstword $(shell ps x | grep $(SERVER_GLOB)))
kill-server:
	@pid=$(SERVER_PID); if [ ! -z $$pid ]; then		\
	    echo "Stopping server process.";			\
	    kill $$pid;						\
	fi

# start the server.
#	For react or inferno, we want npm start
serve:
	npm start

# run tests
#	Setting CI makes it run all tests and then quit.
test:
	CI=true npm run test

# build for production
#
#	gojekyll neither copies nor keeps the .well-known subdirectory,
#	so just copy it from here if we have one.  It's used by our web
#	host for renewing Let's Encrypt certs.  It also contains an empty
#	subdirectory, so we can't easily keep it in git either, since I'm
#	reluctant to mess with it.
#
build:	kill-server
	npm run build

### Publishing (uploading)

# Publish, either to github or somewhere else.
#	If PUBLISH_TO_GITHUB is defined, all we have to do is push.
#	Otherwise, we switch to the prod branch, merge master, build, and push.
#	The server is presumed to be origin in this case.  Either define a
#	suitable hook, or "ssh server git -C path/to/working/tree/ push"
#
#	TODO:  parametrize branch?
github:
	@[ -z "`git status --short`" ] || (git status --short; false)
	git push github

# publishing a production branch to (non-github) server
#	Fail if: there are modified files present
#		 or there is no prod branch to check out.
#
# 	It would be nice if we could run the tests, but there doesn't seem to be
#	a clean way of running them all just once.
#
production:
	@[ -z "`git status --short`" ] || (git status --short; false)
	$(MAKE) test
	git checkout $(PROD_BRANCH)
	git merge -Xtheirs --no-edit master
	$(MAKE) build
	git add -f $(BUILD_DIR)
	git commit -m "production build `date`"
	git push
	git checkout master

# upload build directory
#	This is much simpler than publishing into and pushing a git branch.
#	Note:  upload does not require 
#	builds into ../build (assuming we're in src)
#
upload:
	$(MAKE) test
	$(MAKE) build
	rsync -a $(BUILD_DIR) $(UPLOAD_TO)


### If we're using the MakeStuff package, chain in its Makefile
#	This is optional -- it doesn't affect basic functionality -- but it
#	brings in a lot of useful extras like "make push", recursive "make all",
#	and so on.  Note that include does the right thing if the file list is
#	empty, so we don't have to test for that.
#
#	Normally Makefile is a symlink to Makestuff/Makefile, and
#	local dependencies go into depends.make.  We do it differently
#	here because we want this to be stand-alone.
#
CHAIN = $(wildcard ../MakeStuff/Makefile)
include $(CHAIN)

### report-vars
#	report-vars is also defined in the MakeStuff package, so you can use it to
#	see whether MakeStuff/Makefile is properly chained in.  It's also a very
#	handy way to see whether your make variables are defined properly.
report-vars::
	@echo -ne "" $(foreach v,SERVER_PID BUILD_DIR SRC_DIR,$(v)=$($(v)) "\n")
	@echo " " CHAIN=$(CHAIN)
