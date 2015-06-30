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

.. _using_pip:
Using pip to install from PYPI
------------------------------
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