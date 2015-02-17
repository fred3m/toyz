.. _toyz_api:

********
Toyz API
********
As mentioned previously, Toyz is a web application run on the python 
`Tornado <http://www.tornadoweb.org/en/stable/>`_ web framework. This document won't go into the
details of how Tornado handles requests, as most of this work is done behind the scenes and 
Toyz contains an API that should allow even power users to ignore the Tornado web framework.
The main goal of the web API is to allow scientists, who tend to be more proficient in python
than web languages like html, js, and css, to have to learn and use as little of those
languages as possible. Another goal is to make it quick and easy to build GUI's, as a big
part of the reason that scientific software is mostly done from the command line is that
it's sooooo much easier to do it that way... unless you're using *someone else's* code.

toyz_core.js
============
This module contains the core functions and objects used for communication with the web
application.

Toyz.Core.Websocket
-------------------
Other than ``get`` and ``post`` requests for files, the ``Toyz.Core.Websocket`` object handles
all of the communications with the web application. In practice each web page should only have
a single websocket connection, although multiple tiles and controls on the page can use it 
(there are some exceptions, for example the `file_dialog`_ has its own websocket).

To create a new websocket, on an html pages ``<script>`` section type::

    websocket = new Toyz.Core.Websocket(options);

where options is a JSON object (essentially a python dictionary) that contains optional 
parameters for the websocket. There are no mandatory parameters, so it's possible to simply 
use ``websocket = new Toyz.Core.Websocket({});``

Optional Parameters
^^^^^^^^^^^^^^^^^^^
    + ``rx_action``: function to run when a message is received from the server. Instead of
      specifying an ``rx_action`` it is also possible to specify a callback for each
      message sent to the server
    + ``rx_error``: function to be run if an error occurs on the server. The default function
      alerts the user
    + ``notify``: function to be run if a notification is received from the server
      (such as the successful completion of a task)
    + ``warn``: function to be run if a warning is received from the server
    + ``onopen``: action to be completed once the websocket has established connection with the
      server. This can be useful when designing a web page that waits for a server connection
      before initially populating a set of controls or interactive tools

Sending Jobs to the Server
^^^^^^^^^^^^^^^^^^^^^^^^^^
Jobs are sent to the server via the ``Toyz.Core.Websocket`` using a ``send_task`` function.
``send_task`` requires a JSON object with (at a minimum) a ``task`` key, which tells the server
which function to run. ``Task`` is itself a JSON object that contains ``module``, ``task``,
and ``parameters`` keys.  For example::

    websocket.send_task({
        task: {
            module: 'toyz.web.tasks',
            task: 'create_paths',
            parameters: {
                path: '~/toyz/',
                new_folder: 'temp_folder'
            }
        }
    })

creates a new folder `temp_folder` in the `~/toyz` directory. The `module` key tells the
application which python module (or toy) to use, ``task`` is the function, and ``parameters`` is
a JSON object with parameters to pass to the function.

See :ref:`job_api` for more about sending and running jobs on the server.

Receiving Responses
^^^^^^^^^^^^^^^^^^^
When a job has completed a response is always sent from the server. Depending on whether or not
the response is an error, a warning, a notification, a custom function may be run to handle
the response (which has the option of continuing to the callback or rx_action if any of those
functions return ``false``). Otherwise the ``callback`` function passed to the websocket is run,
or if no callback function was sent, the ``rx_action`` function is run.

.. note::

    If a websocket has an ``rx_action`` specified and receives a callback, the callback is 
    always run.

.. warning::

    Currently, if a connection to the host is lost, the Toyz webpage must be reloaded so that 
    the websocket can establish a new connection, which completely erases all the data on the 
    page. In the future the websocket will try to re-establish connection, but for now: 
    **Save your workspace often in case you lose your connection**

Toyz.Core.FileDialog
--------------------
For obvious reasons most web applications don't want users to be able to browse the contents
of their server, so web browsers do not come with a built in file browser (the way operating
systems do). The Toyz FileDialog is a browser that allows the user to see his/her own custom
shortcuts (to favorite directories), and access all of the files he/she has been granted 
access to from the management console.

To add/delete shortcuts, go to the homepage url (``host:port``) and add/delete options from 
the ``shortcuts`` control group. Don't forget to ``submit``.

.. _job_api:

Job API
=======
The job API handles all tasks sent from clients and runs each one in a new subprocess. In the
future admins will have the option of allowing users to have a subprocess for each session, 
allowing them to store some information in memory while they are interacting with the data
in their web client, but for now each subprocess is destroyed when a job has completed.

Format of a task
----------------
Each task the server receives is a dictionary with the keys ``module``, ``task``, 
``parameters``. For example::

    websocket.send_task({
        task: {
            module: 'toyz.web.tasks',
            task: 'create_paths',
            parameters: {
                path: '~/toyz/',
                new_folder: 'temp_folder'
            }
        }
    })

creates a new folder `temp_folder` in the `~/toyz` directory. The `module` key tells the
application which python module (or toy) to use, ``task`` is the function, and ``parameters`` is
a JSON object with parameters to pass to the function.

Since this is basically a glorified **eval** function (queue record scratch) we need
to make sure that this isn't exploited. This is done in a few ways. 
    1. As mentioned in :ref:`custom_toyz`, a user can only use modules he/she is specifically
       granted permission to execute from the management console
    2. All ``modules`` must end in ``tasks.py``. This makes sure that unwanted 
       functions cannot be run by anyone (even an admin), and also helps keep toyz uniform
       as they all communicate with the web client via a ``...tasks.py`` file
    3. The job manager in the web application parses the task it receives and every task
       function on the server receives the same 3 parameters: ``toyz_settings``, ``tid``,
       ``params``.

``toyz_settings`` contains the settings for the toyz application. 

``tid`` is the task id,
a dictionary containing ``user_id``, ``session_id``, and ``request_id`` fields. The ``user_id``
is the name of the user sending the task (obtained from a secure cookie), the ``session_id`` is
a unique id generated for each websocket to keep track of temporary files, and the 
``request_id`` is number unique to each session to keep track of a task between the 
server and the client.

Finally, ``params`` are the arguments passed to the function from the client (the 
``parameters`` field of the websocket ``task``).

Once again, this format is used both to keep the code uniform and make it more difficult for
someone to hack the system.