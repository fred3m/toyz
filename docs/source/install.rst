.. _install:

*******
Install
*******

Requirements
============
- `Python <https://www.python.org/>`_ 2.7 or later
- `Tornado <http://www.tornadoweb.org/en/stable/>`_ 4.0 or later
- `passlib <https://pythonhosted.org/passlib/>`_ 1.6.2 or later (eventually this will be optional 
  and only required for password protected toyz applications)
- `six <https://pypi.python.org/pypi/six>`_
- `numpy <http://www.numpy.org/>`_ 1.5.1 or later
    + Required to load saved .npy files

Optional (but highly recommended) Requirements
=====================
- `pil <http://www.pythonware.com/products/pil/>`_ or 
  `pillow <https://pillow.readthedocs.org/>`_ 2.7.0 or later
    + Required to view images in workspaces
- `Highcharts <http://www.highcharts.com/download>`_ 4.0 or higher
    + Required for interactive plots and charts
    + Software contains link to online resource but can also be downloaded from
      `http://www.highcharts.com/download`_
    + is free for personal or non-profit use and 
      `reasonably priced <http://shop.highsoft.com/highcharts.html>`_ for commercial use
- `scipy <http://www.scipy.org/>`_ 0.15 or later
    + Speeds up scaling in image viewer
    + Useful for many custom modules and adata analysis
- `matplotlib <http://matplotlib.org/>`_
    + Required to view images in workspaces
- `pandas <http://pandas.pydata.org/>`_
    + Required to connect to a wide variety of data sources including SQL databases,
      hdf5, specially formated text files, etc.
- `sqlalchemy`_
    + Required to conenct to SQL databases
- `astropy <http://www.astropy.org/>`_
    + Required to view FITS images

Installing Toyz
===============
The Toyz framework only needs to be installed on the machine acting as the server. This can be 
a local machine, remote server, or even remote super-computer (we are working on testing this
on a blue-gene super computer at the University of Rochester at this time).

Anaconda Users
--------------
The easiest way I've found to ensure that all of your scientific python modules cooperate 
with each other is to install `Anaconda <http://docs.continuum.io/anaconda/>`_. Follow the
anaconda documentation to setup a new conda environment and install all of the required
and optional packages above. Then follow the instructions below in the :ref:`using_pip`
section.

.. _using_virtualenv:

Using virtualenv to install from PYPI
-------------------------------------
If you are not using anaconda, the next best option is to use virtualenv.
For those new to python you will soon discover that while the language is
fairly OS agnostic one of its biggest advantages and issues is its modular
layout. Most packages depend on other 3rd party packages not distributed
with the main python standard library. Because many of these packages are
under constant development there can be instances where a 3rd party
library might have a conflict with a different third party library and
cause certain feature of toyz to malfunction.

`virtualenv <https://virtualenv.pypa.io/en/latest/>`_ is a package that 
allows you to setup virtual python environments that allow a single
machine to have multiple versions of the same package installed. Below
are tips in creating a virtual environment that you can use to install toyz.

To install virtualenv

    $ pip install virtualenv

Now navigate to a folder that will become the parent of your virtual environment,
for example:

    $ cd ~

Now you can create a virtual environment

    $ virtualenv toyzenv

This creates a virtual environment but now you must activate it using

    $ source toyzenv/bin/activate

For the rest of your terminal session you will see your prompt preceeded by
``(toyzenv)``. Now any packages you install via pip or from source using
``python setup.py install`` will be installed to the virtual environment,
not your system wide python installation. You will have to run
``source toyzenv/bin/activate`` every time you open a new terminal unless
you add it to your ``.bash_profile``. To exit the virtual environment at
any time simply type

    (toyzenv) $ deactivate

and you will return to your system wide python environment.
Once you have activated your new virtual environment proceed to
:ref:`using_pip`.

.. note::

    One of the advantages to using anaconda instead of virtualenv is that
    anaconda already contains multiple pre-compiled versions of almost all of the 
    packages toyz is dependent on, meaning it is much faster to install. If you are
    installing a new virtual environment it can take a long time to download
    and compile numpy, scipy, and astropy (if you are using astrotoyz).

.. _using_pip:

Using pip to install from PYPI
------------------------------
.. warning::

    If you are not using anaconda or virtualenv proceed with caution, some of the 
    dependencies of Toyz may have conflicts with other packages and we are still
    tracing the origin of these errors (see :ref:`using_virtualenv` for more). 

Toyz is registered in the `Python Package Index (pypi) <https://pypi.python.org/pypi>`_ 
and can be installed using ::

    pip install toyz

To install all of the required and optional dependencies use ::

    pip install toyz[all]

Some packages like numpy, scipy, and astropy might take a while to compile.

.. note::

    pip can also be used to install the source code (see :ref:`installing_from_source`)

.. _installing_from_source:

Installing from source
----------------------

Obtaining the source code
^^^^^^^^^^^^^^^^^^^^^^^^^
Download the source code `here <https://github.com/fred3m/toyz>`_ on github, or by typing::

    git clone git://github.com/fred3m/toyz.git

Installing
^^^^^^^^^^
To install Toyz from the source code if you already have all of the dependencies,
navigate to the root directory of the source code and type::

    python setup.py install

To install all of the required and optional dependencies navigate to the root directory of the
source code and type ::

    pip install -e .[all]

.. note:: 

    On unix systems you may be required to prepend '*sudo*' to your install command::

        sudo python setup.py install

As this is a new package, please let me know any problems you have had installing the source code
so I can fix them or share steps needed to resolve them with other users. For bugs, please
create an `issue <https://github.com/fred3m/toyz/issues>`_ on github. For other comments or
suggestions please create a post on our 
`Google Group <https://groups.google.com/forum/#!forum/toyz-dev>`_