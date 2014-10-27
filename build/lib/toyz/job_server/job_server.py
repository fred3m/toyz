# job_server.py
# Administration for Jobs in Astro Pypeline
# Copyright 2014 by Fred Moolekamp
# License: GPLv3

# Python imports
from __future__ import division,print_function
from random import *
import os
import sys
import hashlib

# astropyp imports
from ..utils import core
from ..web_server import web_settings
from  . import job_settings

# If not using a database, send the response directly to the web server
if not web_settings.USE_DATABASE:
    active_users = core.active_users
else:
    active_users = {}

ROOT_DIR = core.ROOT_DIR

def process_job(job):
    core.run_job(job)