.. _custom_toyz:

********************
Creating Custom Toyz
********************
While the default tools included with Toyz will meet the needs of some researchers, most
will need to build their own tools into the framework to suit their specific research needs.
For this reason Toyz was designed to be a framework that can be built on as opposed to a
stand-alone web application. It would take a very long document indeed to describe all of the
current parts of Toyz that can be customized, but this document will cover some of the more
common and useful customizations that can be made.

.. warning::

    You must be an administrator to add new Toyz to your application. The rest of this
    document assumes that you are logged on with an administrative account

Creating and Installing Your First Toy
======================================
To get started it is recommended that you fork the 
`Toyz Template <https://github.com/fred3m/toyz-template>`_ into your own github repository,
or download the source code onto your local machine. You can use this template to create all
of your own custom Toyz, but for now we'll just import this module into our Toyz instance to see
how this is done. This can be done in two different ways, which are outlined below.

Installing a Built Toyz Module
------------------------------
If you navigate to the ``toyz-template`` directory in your terminal, type::

    python setup.py install

This will create a module ``toyz_template`` in your python path. Now open up your Toyz instance
to the main homepage (``host:port``)(for more on this see :ref:`running_toyz`). You should see
a control group labeled ``Toyz Modules``. Click the ``+`` button and in the text box enter 
``toyz_template``, then click the ``Submit`` button. You should get a message that the settings
have been saved successfully. If you use this method, remember that if you make any changes to
your Toy you need to run the setup command again before Toyz will be able to use the changes.

Installing a Local (uninstalled) Module
---------------------------------------
You may not want to install Toyz into your python path but instead link to a directory on your 
server (or local machine, if that is where you are running Toyz). In this case open your Toyz
instance to the main homepage (``host:port``)(for more on this see :ref:`running_toyz`). This 
time click the ``+`` sign in the ``Toyz Paths`` control group. In the ``toyz_name`` field type
``toyz_template`` and in the ``path`` field enter ``.../toyz-template/toyz_template`` on a unix
machine or ``...\toyz-template\toyz_template`` on a windows machine, where ``...`` represents the
path to the ``toyz-template`` directory. That's it!

Making it Your Own
==================
The template is commented to assist you in customizing this template into your own Toy.
Eventually I hope to make a tutorial that walks you through this process but for now the
next few sections will describe some of the different components that you can customize and
how to modify and manipulate them.