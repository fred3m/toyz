.. _toyz_gui:

************
Toyz Web GUI
************
When I first started to make interactive controls using javascript I quickly learned why most 
people don't... it's very time consuming! Typically a form must be created using html's 
bulky syntax, or using jQuery's slighly less bulky syntax, and then to submit the form each
component must be loaded individually.

To ease the process Toyz has a JSON parser that takes a JSON object (or python dictionary) and
uses that to build an interface for the user. The advantage (besides being slightly faster to)
create the controls, is that the parser builds them in such a way that a single ``get`` function
can get all of the parameters in the correct format to pass to a python function without having
to manually re-configure any of them! In addition, when a dictionary is sent from the web
application (like a set of saved settings), all of the inputs are populated instantly! This 
includes standard text/numerical inputs, select boxes, lists, and dictionaries (lists with
a specific format), and even the option for users to define their own controls (which has not 
been thoroughly tested yet).

Below is a brief guide to the different inputs and controls currently implemented.

Parameters
==========
Parameters are all given as JSON objects. The key of a parameter is it's name, and the
values are its properties. 

For example::

    var params = {
        type: 'div',
        legend: 'User Info',
        params: {
            name: {
                lbl: 'name',
            },
            age: {
                lbl: 'age',
                prop: {
                    type: 'Number'
                }
            }
            group: {
                type: 'select',
                options: {
                    red: 'Red',
                    blue: 'Blue',
                    green: 'Green'
                }
            }
        }
    };

creates a div with two input boxes: ``name`` and ``age``, and a select box ``groups`` that has
three options ``red``, ``blue``, ``green``.

Properties for all Parameters
=============================

``type``: optional
------------------
    - Type of parameter.
    - If no ``type`` is given the parameter defaults to ``input``

``prop``: optional 
------------------
    - Lists any properties of the html element
    - Uses the jquery `.prop` function to add the property to the parameters html element

``css``: optional
-----------------
    - Lists any styles for the html elements. This uses the jquery `.css` function

``func``: optional
------------------
    - Functions attached to the parameter.
    - Works for any jquery event for the given element type

Example::

    var my_button = {
        type: 'button',
        prop: {
            innerHTML: 'click me'
        },
        func: {
            click: function(){
                alert('You clicked me')
            }
        }
    }

will alert the user when the button is clicked.

``events``: optional
    - Dictionary whose keys are Toyz events (not to be confused with javascript window events)
    - For each event, a function is given that is called when a Toyz application triggers
      the given event

Container Parameters
====================

div
---
``div`` defines an HTML div (division) element on the webpage.

Properties for all div containers
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

``legend``: optional 
    - If `legend` is given, the div is wrapped in a `fieldset` with `legend` as the title

``legend_class``: optional
    - Included if any classes are to be set for the legend

``legend_css``: optional
    - Included if any styles are to be set for the legend (uses jquery `.css` function)

``div_class``: optional
    - If it is desired to set any classes for the div container, it can be done using the
      ``classDiv`` field

``div`` Properties
^^^^^^^^^^^^^^^^^^

``params``: required
    - Each key in ``params`` is a parameter in the div
    - This can be any type of parameter, including another ``div``

conditional
-----------
Similar to a ``div``, but a conditional contains a ``selector`` that allows the user to 
choose from a list of options, then display a ``div`` that contains a subset of parameters
based on the selection choice.

``conditional`` Properties
^^^^^^^^^^^^^^^^^^^^^^^^^^

``selector``: required
    - Parameter that for certain values will cause a subset of parameters to appear on the form.
      This will usually have input type ``select`` or input type ``checkbox``

``param_sets``: required
    - Subsets of parameters for each value of the selector. If a particular value doesn't have
      a subset, do not give it a key in ``param_sets``

Example::

    var my_param = {
        type: 'conditional',
        params: {
            model: {
                type: 'select',
                options: {
                    polynomial: 'polynomial',
                    gaussian: 'gaussian',
                    exponential: 'exponential',
                }
            }
        },
        param_sets: {
            polynomial: {
                type: 'div',
                params: {
                    order: {
                        prop: {
                            type: 'number',
                            value: 2
                        }
                    },
                    coefficients: {
                        lbl: 'initial guess (coefficients)',
                        prop: {
                            value: '0,1,1'
                        }
                    }
                }
            },
            gaussian: {
                type: 'div',
                params: {
                    mean: {
                        prop: {
                            type: 'number',
                            value: 0
                        }
                    },
                    std_dev: {
                        lbl: 'standard deviation',
                        prop: {
                            type: 'number',
                            value: 1
                        }
                    },
                    amplitude: {
                        prop: {
                            type: 'number',
                            value: 1
                        }
                    },
                    floor: {
                        prop: {
                            type: 'number',
                            value: 0
                        }
                    }
                }
            }
    }

creates a drop down box that allows the user to select a function type 
(polynomial, gaussian, exponential), and if either `polynomial` or `gaussian` is chosen,
a subset of parameters is given.

Input Parameters
================

Properties for all input parameters
-----------------------------------
In addition to the properties available for all parameters, there are some properties 
available to all input parameters

``lbl``: optional 
    - If given, this is a label shown to the left of an input parameter

``div_class`` and ``div_css``: optional
    - Each input parameter is contained in a `div` that is roughly of the form::

        <div><label>Input label:</label><input></input></div>

    - If it is desired to set any classes for the parent div, it can be done using the
      ``classDiv`` field
    - If it is desired to change the style of the parent div, it can be done by using the 
      ``divCss`` field (this uses the jquery ``.css`` function)

``lbl_class`` and ``lbl_css``: optional
    - If the user wants to customize the label for a parameter, classes can be added by using the
    ``lbl_class`` property, and styles can be added by using the `lbl_css` property

``title``: optional
    - Sets the tooltip title of the input div (this includes both the label and the input)

``units``: optional
    - Some parameters may have optional units that can be set
    - The value of the units field is a list of available units (if multiple units are available)
      or a single string (if units is just a label for the users benefit)

Example::

    var velocity = {
        prop: {
            type: 'Number'
        },
        units: ['m/s','km/s', 'mph']
    };

creates a number input with a dropdown units box containing ``m/s``, ``km/s``, ``mph`` 
as possible units. 

``file_dialog``: optional
    - Many times the input will be a path or filename from the server
    - This option creates a button that opens a file manager to view directories and files
      available for the user
    - The value of `file_dialog` does not matter, but is typically set to ``true``

Example::

    var file_dialog = new Toyz.Core.FileDialog({});
    
    var my_path = {
        lbl: 'path',
        file_dialog: true
    }

input
=====
This is the default if no ``type`` is given for a parameter. If no additional properties are
given, a text box with no label will appear on the form. This object has no special properties
other than the ones listed above for all parameters.

Input types
-----------
To set the type of an input (for example a checkbox, or number (as opposed to a string)) use 
``{prop: type: input_type}``. For example::

    var my_input = {
        prop: {
            type: 'checkbox',
            'checked': true
        }
    }

creates a checkbox with ``true`` as its default value.

select
------
Select (drop-down) box, consisting of a list of options that can later be changed or updated.

``select`` Properties
^^^^^^^^^^^^^^^^^^^^^

``options``: required
    - Objects whose keys are the values of select HTML object and values are the text 
      displayed to the user

``order``: optional
    - An array that lists the order in which options should be added to the select box
    - Only options in the order array will be added to the select box

Example::

    var stoplight = {
        type: 'select',
        options: {
            green: 'Green light',
            yellow: 'Yellow light',
            red: 'Red light',
        },
        defaultVal: 'red'    
    }

creates a drop-down box with a default value of ``red``.

list
----
An editable list of objects. If the input required is something as simple as a simple list of
numbers (input = [1,2,3,4,5]) it may be best to simply have a text input and parse the results
by separating on the `,`.

The ``list`` type is geared toward more complicated inputs, such as dictionaries, lists of
lists (where each entry in the list is also a list) or more complicated custom input types.
Each element in the list has a radio button to choose the current entry that can be removed 
(if desired), as well as built in controls to add/remove entries.

`list` Properties
^^^^^^^^^^^^^^^^^

``format``: required
    - Format of the input from: ``list``, ``dict``, ``OrderedDict``, ``custom``. 
      Defaults to ``list``.
      (OrderedDict and none not supported yet)
    - For format = ``dict``, ``new_item`` is required to be a ``div``

``ordered``: optional
    - Boolean that describes whether or not the list is numbered or not. Defaults to ``false`` 
      (unordered list `<ul>`)

``buttons``: optional
    - Defines a div containing buttons for the list. If ``buttons`` is not defined, the default 
      is to have an ``add`` button and ``remove`` button and add/remove items from the list

``new_item``: required
    - When the ``add`` button is clicked, a new item is added to the list. ``newItem`` can 
      either be a ``div`` with sub parameters or a single parameter

``newItem`` Properties
^^^^^^^^^^^^^^^^^^^^^^
New items are a bit different than ordinary divs because ``list`` objects might actually be
dictionaries or lists of lists. As a result, ``new_item`` objects have additional properties

``key``, ``value``: required for format=``dict``
    - ``key`` and ``value`` of the dictionary when getting/setting values
    - In this case, ``new_item`` is required to be a ``div``

Example::

    var my_div = {
        type: 'div',
        legend: 'shortcut',
        paramas: {
            key: {
                lbl: 'path name'
            },
            value: {
                lbl: 'path',
            }
        }
    }

will create a div that contains a field to return a dictionary key:value pair.

``get``: required for format=``custom``
    - Function to get the value of the custom list parameter

``set``: required for format=`custom`
    - Function to set the value of the custom list parameter

``list`` Examples
^^^^^^^^^^^^^^^

Dictionary input Example:

    var my_list = {
        type: 'list',
        new_item: {
            type: 'div',
            format: 'dict',
            params: {
                key: {
                    lbl: 'knickname',
                },
                value: {
                    lbl: 'full name'
                }
            }
        }
    }

List input Example:

    var my_list = {
        type: 'list',
        new_item: {
            type: 'div',
            format: 'list',
            items: 3,
            params: {
                li1: {
                    lbl: 'name',
                },
                li2: {
                    lbl: 'age'
                    type: 'Number'
                },
                li3:{
                    lbl: 'height',
                    units: ['feet', 'inches', 'm', 'cm']
                }
            }
        }
    }

button
------
Buttons are not actually inputs but still might exist on the form. They have no special 
properties other than those given above for all objects, but typically will have a ``click`` 
function given by the ``func`` object.

custom
-------
It is also possible for users to specify a custom input type, for example some type of control.
In this case the method of setting and retrieving the value of the input must be given.