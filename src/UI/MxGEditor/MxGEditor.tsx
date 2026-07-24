import React, { useRef, useState, useEffect } from "react";
import "./MxGEditor.css";
import { useSession } from "@variamosple/variamos-components";

// ajust language to real type ? 
import { Language } from "../../Domain/ProductLineEngineering/Entities/Language";

import { mxGraph } from "mxgraph";
import { ZoomIn, ZoomOut } from "react-bootstrap-icons";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import mx from "./mxgraph";
import MxgraphUtils from "../../Infraestructure/Mxgraph/MxgraphUtils";

import { Relationship } from "../../Domain/ProductLineEngineering/Entities/Relationship";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { getLanguagesByUser } from "../../DataProvider/Services/languageService";

interface Props {
  model: Model;
}

export default function MxGEditor({ model }: Props) {
  // Refs
  const containerRef = useRef<any>(null);
  const graphContainerRef = useRef<any>(null);

  // Variables d'instance (équivalent aux propriétés de classe)
  const modelSnapshots = useRef<Map<string, { elements: any[]; relationships: any[] }>>(new Map());

  // State
  const [showMessage, setShowMessage] = useState(false);
  const [messageModalContent, setMessageModalContent] = useState<string | null>(null);
  const [messageModalTitle, setMessageModalTitle] = useState<string | null>(null);

  const [languageDefinition, setLanguageDefinition] = useState<any>(null);
  const { user } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const graphRef = useRef<mxGraph | null>(null);

  useEffect(() => {
    setUserId(user.id);
  }, [user]);


  useEffect(() => {
    const loadLanguages = async () => {
      const languages = await getLanguagesByUser(userId);
      console.log("Languages loaded for user:", languages);
      setLanguageDefinition(languages.find((lang) => lang.name === model.type) || null);
    };
    loadLanguages();
  }, [model, userId]);

  useEffect(() => {
    if (!graphContainerRef.current) return;
    const graph = new mx.mxGraph(graphContainerRef.current);
    LoadGraph(graph);
    graphRef.current = graph;
    return () => graph.destroy?.();
  }, []);

  useEffect(() => {
    if (!graphRef.current || !languageDefinition) return;

    loadModel(model);
  }, [model, languageDefinition]);

  function LoadGraph(graph: mxGraph) {
    mx.mxStencil.prototype.allowEval = true;

    mx.mxEvent.disableContextMenu(graphContainerRef.current);
    const rubber = new mx.mxRubberband(graph);
    //@ts-ignore
    rubber.setEnabled(true);
    graph.setEnabled(true);

    graph.setConnectable(false);
    graph.setCellsMovable(false);
    graph.setCellsResizable(false);
    graph.setCellsEditable(false);
    graph.setCellsDisconnectable(false);

    graph.setPanning(true);
    graph.setTooltips(true);

    graph.setHtmlLabels(true);

    
    graph.convertValueToString = function (cell) {
      try {
        if (cell.value) {
          if (cell.value.attributes) {
            return cell.value.getAttribute("label", "");
          } else {
            return cell.value;
          }
        }
        else if (cell.attributes) {
          return cell.getAttribute("label", "");
        } else {
          return "";
        }
      } catch (error) {
        return "";
      }
    };


    graph.getView().setAllowEval(true);
  }

  function findModelRelationshipById(model: Model, uid: any) {
    if (model) {
      for (let i = 0; i < model.relationships.length; i++) {
        const relationship: any = model.relationships[i];
        if (relationship.id === uid) {
          return relationship;
        }
      }
    }
    return null;
  }

  function refreshEdgeStyle(edge: any) {
    let relationship = findModelRelationshipById(model, edge.value.getAttribute("uid"));
    if (languageDefinition.concreteSyntax.relationships) {
      if (languageDefinition.concreteSyntax.relationships[relationship.type]) {
        //styles
        if (languageDefinition.concreteSyntax.relationships[relationship.type].styles) {
          for (let i = 0; i < languageDefinition.concreteSyntax.relationships[relationship.type].styles.length; i++) {
            const styleDef = languageDefinition.concreteSyntax.relationships[relationship.type].styles[i];
            if (!styleDef.linked_property) {
              edge.style = styleDef.style;
            } else {
              for (let p = 0; p < relationship.properties.length; p++) {
                const property = relationship.properties[p];
                if (property.name === styleDef.linked_property && property.value === styleDef.linked_value) {
                  edge.style = styleDef.style;
                  i = languageDefinition.concreteSyntax.relationships[relationship.type].styles.length;
                  break;
                }
              }
            }
          }
        }

        //labels  
        if (edge.children) {
          for (let index = edge.children.length - 1; index >= 0; index--) {
            let child = edge.getChildAt(index);
            child.setVisible(false);
            //child.removeFromParent(); //no funciona, sigue mostrandolo en pantalla
          }
        }
        if (languageDefinition.concreteSyntax.relationships[relationship.type].labels) {
          for (let i = 0; i < languageDefinition.concreteSyntax.relationships[relationship.type].labels.length; i++) {
            const def = languageDefinition.concreteSyntax.relationships[relationship.type].labels[i];
            let style = ''; // 'fontSize=16;fontColor=#000000;fillColor=#ffffff;strokeColor=#69b630;rounded=1;arcSize=25;strokeWidth=3;';
            if (def.style) {
              style = def.style;
            }
            let labels = [];
            if (def.label_fixed) {
              labels.push("" + def.label_fixed);
            } else if (def.label_property) {
              let ls = [];
              if (Array.isArray(def.label_property)) {
                ls = def.label_property;
              } else {
                ls = [def.label_property];
              }
              for (let p = 0; p < relationship.properties.length; p++) {
                const property = relationship.properties[p];
                if (ls.includes(property.name)) {
                  if (property.value) {
                    labels.push("" + property.value);
                  } else {
                    labels.push("");
                  }
                }
              }
            }
            if (labels.length > 0) {
              let separator = ", "
              if (def.label_separator) {
                separator = def.label_separator;
              }
              let label = labels.join(separator);
              let x = 0;
              let y = 0;
              let offx = 0;
              if (def.offset_x) {
                offx = (def.offset_x / 100);
              }
              let offy = 0;
              if (def.offset_y) {
                offy = def.offset_y
              }
              switch (def.align) {
                case "left":
                  x = -1 + offx;
                  break;
                case "right":
                  x = +1 + offx;
                  break;
              }
              if (def.offset_x) {
                offx = def.offset_x
              }
              if (def.offset_y) {
                offy = def.offset_y
              }
              var e21 = graphRef.current.insertVertex(edge, null, label, x, y, 1, 1, style, true);
              e21.setConnectable(false);
              graphRef.current.updateCellSize(e21);
              // Adds padding (labelPadding not working...)
              e21.geometry.width += 2;
              e21.geometry.height += 2;

              offx = 0;
              e21.geometry.offset = new mx.mxPoint(offx, offy); //offsetx aqui no funciona correctamente cuando la dirección se invierte
            }
          }
        }
      }
    }
  }


  function refreshEdgeLabel(edge: any) {
    let label_property = null;
    let relationship = findModelRelationshipById(model, edge.value.getAttribute("uid"));
    
    if (languageDefinition.concreteSyntax.relationships) {
      if (languageDefinition.concreteSyntax.relationships[relationship.type]) {
        if (languageDefinition.concreteSyntax.relationships[relationship.type].label_fixed) {
          edge.value.setAttribute("label", languageDefinition.concreteSyntax.relationships[relationship.type].label_fixed);
          return;
        }
        else if (languageDefinition.concreteSyntax.relationships[relationship.type].label_property) {
          label_property = languageDefinition.concreteSyntax.relationships[relationship.type].label_property;
          let property = findProperty(relationship, label_property);
          if (property != null) {
            let label = property.value;
            if (label === "IndividualCardinality") {
              let minProperty = findProperty(relationship, "MinValue");
              let maxProperty = findProperty(relationship, "MaxValue");
              if (minProperty != null && maxProperty != null) {
                let minValue = minProperty.value;
                let maxValue = maxProperty.value;
                label = label + "\n[" + minValue + ".." + maxValue + "]";
              }
            }
            edge.value.setAttribute("label", label);
            return;
          }
        }
      }
    }
    if (!label_property) {
      edge.value.setAttribute("label", relationship.name);
    } else {
      edge.value.setAttribute("label", "");
    }
  }

  function findProperty(relationship, name) {
    for (let p = 0; p < relationship.properties.length; p++) {
      const property = relationship.properties[p];
      if (property.name === name) {
        return property;
      }
    }
    return null;
  }

  function findModelElementById(model: Model, uid: any) {
    if (model) {
      for (let i = 0; i < model.elements.length; i++) {
        const element: any = model.elements[i];
        if (element.id === uid) {
          return element;
        }
      }
    }
    return null;
  }

  function refreshVertexLabel(vertice: any) {
    let label_property = null;
    let uid = vertice.value.getAttribute("uid");
    let element = findModelElementById(model, uid);
    if (!element) {
      return;
    }

    vertice.value.setAttribute("Name", element.name);
    for (let i = 0; i < element.properties.length; i++) {
      const p: any = element.properties[i];
      vertice.value.setAttribute(p.name, p.value);
      let typeDescription = "";
      if (!p.possibleValues) {
        typeDescription = p.type;
      } else if (p.possibleValues.startsWith("[")) {
        let str = p.possibleValues;
        if (str.length <= 2) {
          str = "";
        } else {
          str = str.slice(1, -1);
        }
        typeDescription = p.type + " in " + str;
      } else {
        typeDescription = "{" + p.possibleValues + "}";
      }
      vertice.value.setAttribute(p.name + "_typeDescription", typeDescription);
    }

    if (languageDefinition.concreteSyntax.elements) {
      if (languageDefinition.concreteSyntax.elements[element.type]) {
        if (languageDefinition.concreteSyntax.elements[element.type].label_fixed) {
          vertice.value.setAttribute("label", languageDefinition.concreteSyntax.elements[element.type].label_fixed);
          return;
        }
        else if (languageDefinition.concreteSyntax.elements[element.type].label_property) {
          label_property = languageDefinition.concreteSyntax.elements[element.type].label_property;
          for (let p = 0; p < element.properties.length; p++) {
            const property = element.properties[p];
            if (property.name === languageDefinition.concreteSyntax.elements[element.type].label_property) {
              vertice.value.setAttribute("label", property.value);
              return;
            }
          }
        }
      }
    }
    if (!label_property) {
      vertice.value.setAttribute("label", element.name);
    } else {
      vertice.value.setAttribute("label", "");
    }


  }

  function pushIfNotExist(array: any, value: any) {
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (item === value) {
        return;
      }
    }
    array.push(value);
  }

  function loadModel(model: Model) {
    setTimeout(() => {
      if (model.inconsistent) {
        showMessageModal("Inconsistent model", model.consistencyError);
      }

      if (graphRef.current) {
        graphRef.current.getModel().beginUpdate();
        try {
          const graphModel = graphRef.current.getModel();
          const parent = graphRef.current.getDefaultParent();
          const childCount = graphModel.getChildCount(parent);

          for (let i = childCount - 1; i >= 0; i--) {
            graphModel.remove(graphModel.getChildAt(parent, i));
          }
          // ---------------------------------------------------------
          if (model) {
            if (!languageDefinition) {
              console.error("Language definition not found for model type:", model.type);
              showMessageModal("Error", "Language definition not found for model type: " + model.type);
              return;
            }
            let orden = [];
            for (let i = 0; i < model.elements.length; i++) {
              let element: any = model.elements[i];
              if (element.parentId) {
                pushIfNotExist(orden, element.parentId);
              }
              pushIfNotExist(orden, element.id);
            }

            let vertices = [];

            for (let i = 0; i < orden.length; i++) {
              let element: any = findModelElementById(model, orden[i]);
              if (!languageDefinition.concreteSyntax.elements[element.type]) {
                continue;
              }

              let shape = null;
              if (languageDefinition.concreteSyntax.elements[element.type].styles) {
                let styles = languageDefinition.concreteSyntax.elements[element.type].styles;
                for (let s = 0; s < styles.length; s++) {
                  const styleDef = styles[s];
                  if (!styleDef.linked_property) {
                    shape = atob(styleDef.style);
                  } else {
                    for (let p = 0; p < element.properties.length; p++) {
                      const property = element.properties[p];
                      if (property.name === styleDef.linked_property && '' + property.value === styleDef.linked_value) {
                        shape = atob(styleDef.style);
                        s = styles.length;
                        break;
                      }
                    }
                  }
                }
              }
              else if (languageDefinition.concreteSyntax.elements[element.type].draw) {
                shape = atob(
                  languageDefinition.concreteSyntax.elements[element.type].draw
                );
              }

              if (shape) {
                let ne: any = mx.mxUtils.parseXml(shape).documentElement;
                ne.setAttribute("name", element.type);
                MxgraphUtils.modifyShape(ne);
                let stencil = new mx.mxStencil(ne);
                mx.mxStencilRegistry.addStencil(element.type, stencil);         
              }

              let parent = graphRef.current.getDefaultParent();
              if (element.parentId) {
                parent = vertices[element.parentId];
              }

              var doc = mx.mxUtils.createXmlDocument();
              var node = doc.createElement(element.type);
              node.setAttribute("uid", element.id);
              node.setAttribute("label", element.name);
              node.setAttribute("Name", element.name);
              graphRef.current.refresh();
              node.setAttribute("type", element.type);
              for (let i = 0; i < element.properties.length; i++) {
                const p = element.properties[i];
                node.setAttribute(p.name, p.value);
              }
              let fontcolor = "";
              if (shape) {
                let color = getFontColorFromShape(shape);
                if (color) {
                  fontcolor = "fontColor=" + color + ";"
                }
              }
              let design = languageDefinition.concreteSyntax.elements[element.type].design;
              let styleShape = "shape=" + element.type + ";whiteSpace=wrap;" + fontcolor + design;
              let resizable = languageDefinition.concreteSyntax.elements[element.type].resizable;
              if ("" + resizable === "false") {
                styleShape += ";resizable=0;";
              }
              styleShape += fontcolor + design;
              let vertex = graphRef.current.insertVertex(
                parent,
                null,
                node,
                element.x,
                element.y,
                element.width,
                element.height,
                styleShape
              );
              refreshVertexLabel(vertex);
              graphRef.current.refresh();
              createOverlays(element, vertex);
              vertices[element.id] = vertex;
            }

            let parent = graphRef.current.getDefaultParent();

            for (let i = 0; i < model.relationships.length; i++) {
              const relationship: Relationship = model.relationships[i];
              let source = MxgraphUtils.findVerticeById(graphRef.current, relationship.sourceId, null);
              let target = MxgraphUtils.findVerticeById(graphRef.current, relationship.targetId, null);
              let doc = mx.mxUtils.createXmlDocument();
              let node = doc.createElement("relationship");
              node.setAttribute("uid", relationship.id);
              node.setAttribute("label", relationship.name);
              node.setAttribute("type", relationship.type);

              var cell = graphRef.current.insertEdge(parent, null, node, source, target, 'strokeColor=#69b630;strokeWidth=3;endArrow=block;endSize=8;edgeStyle=elbowEdgeStyle;');
              if (!cell) return;
              try {
                refreshEdgeLabel(cell);
                refreshEdgeStyle(cell);
              } catch (e) {
                console.warn("Edge refresh failed", e, cell);
              }
              cell.geometry.points = [];
              if (relationship.points) {
                for (let k = 0; k < relationship.points.length; k++) {
                  const p = relationship.points[k];
                  cell.geometry.points.push(new mx.mxPoint(p.x, p.y));
                }
              }
            }
          }
        } finally {
          graphRef.current.getModel().endUpdate();

          if (model && graphRef.current) {
            const modelKey = `${model.type}_${model.id}`;
            // Actualizar snapshot específico para este modelo
            modelSnapshots.current.set(modelKey, {
              elements: JSON.parse(JSON.stringify(model.elements || [])),
              relationships: JSON.parse(JSON.stringify(model.relationships || []))
            });
          }
        }
      }
    }, 250);
  }

  function getFontColorFromShape(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const shapeElement = xmlDoc.querySelector("shape");
    const aspectValue = shapeElement ? shapeElement.getAttribute("fontcolor") : null;
    return aspectValue;
  }

  function createOverlays(element: any, cell: any) {
    graphRef.current.removeCellOverlays(cell);
    createSelectionOverlay(element, cell);
    createCustomOverlays(element, cell);
  }

  function createSelectionOverlay(element: any, cell: any) {
    for (let i = 0; i < element.properties.length; i++) {
      const property = element.properties[i];
      if (property.name === "Selected") {
        let icon = '/variamos_laboratory/images/models/' + property.value + '.png'
        let overlayFrame = new mx.mxCellOverlay(new mx.mxImage(icon, 24, 24), 'Overlay tooltip');
        overlayFrame.align = mx.mxConstants.ALIGN_RIGHT;
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_TOP;
        overlayFrame.offset = new mx.mxPoint(0, 0);

        overlayFrame.addListener(mx.mxEvent.CLICK, function (sender, evt) {
          try {
            evt.consume();
            let parentCell = evt.properties.cell;
            let uid = parentCell.value.attributes.uid.value;
            for (let i = 0; i < model.elements.length; i++) {
              const element = model.elements[i];
              if (element.id === uid) {
                return element;
              }
            }

            for (let i = 0; i < element.properties.length; i++) {
              const property = element.properties[i];
              if (property.name === "Selected") {
                switch (property.value) {
                  case "Selected": property.value = "Unselected"; break;
                  case "Unselected": property.value = "Undefined"; break;
                  case "Undefined": property.value = "Selected"; break;
                  default: property.value = "Unselected"; break;
                }
              }
            }
            createOverlays(element, parentCell);
          } catch (error) { }
        });

        graphRef.current.addCellOverlay(cell, overlayFrame);
        graphRef.current.refresh();
      }
    }
  }

  function createCustomOverlays(element: any, cell: any) {
    if (languageDefinition.concreteSyntax.elements) {
      if (languageDefinition.concreteSyntax.elements[element.type]) {
        if (languageDefinition.concreteSyntax.elements[element.type].overlays) {
          let overs = [];
          for (let i = 0; i < languageDefinition.concreteSyntax.elements[element.type].overlays.length; i++) {
            let overlayDef = languageDefinition.concreteSyntax.elements[element.type].overlays[i];
            if (!overlayDef.linked_property) {
              overs[overlayDef.align] = overlayDef;
            }
          }
          for (let i = 0; i < languageDefinition.concreteSyntax.elements[element.type].overlays.length; i++) {
            let overlayDef = languageDefinition.concreteSyntax.elements[element.type].overlays[i];
            if (overlayDef.linked_property) {
              for (let p = 0; p < element.properties.length; p++) {
                const property = element.properties[p];
                if (property.name === overlayDef.linked_property && property.value === overlayDef.linked_value) {
                  overs[overlayDef.align] = overlayDef;
                }
              }
            }
          }
          for (let key in overs) {
            let overlayDef = overs[key];
            createCustomOverlay(cell, overlayDef.icon, overlayDef.align, overlayDef.width, overlayDef.height, overlayDef.offset_x, overlayDef.offset_y);
          }
        }
      }
    }
  }

  function createCustomOverlay(cell: any, base64Icon: any, align: any, width: any, height: any, offset_x: any, offset_y: any) {
    let url = "data:image/png;base64," + base64Icon;
    if (!width) {
      width = 24;
    }
    if (!height) {
      height = 24;
    }
    let overlayFrame = new mx.mxCellOverlay(new mx.mxImage(url, width, height), 'Overlay tooltip');
    overlayFrame.verticalAlign = mx.mxConstants.ALIGN_BOTTOM;
    overlayFrame.align = mx.mxConstants.ALIGN_LEFT;
    switch (align) {
      case "top-left":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_TOP;
        overlayFrame.align = mx.mxConstants.ALIGN_LEFT;
        break;
      case "top-right":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_TOP;
        overlayFrame.align = mx.mxConstants.ALIGN_RIGHT;
        break;
      case "bottom-left":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_BOTTOM;
        overlayFrame.align = mx.mxConstants.ALIGN_LEFT;
        break;
      case "bottom-right":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_BOTTOM;
        overlayFrame.align = mx.mxConstants.ALIGN_RIGHT;
        break;
      case "middle":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_MIDDLE;
        overlayFrame.align = mx.mxConstants.ALIGN_CENTER;
        break;
      case "middle-left":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_MIDDLE;
        overlayFrame.align = mx.mxConstants.ALIGN_LEFT;
        break;
      case "middle-right":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_MIDDLE;
        overlayFrame.align = mx.mxConstants.ALIGN_RIGHT;
        break;
      case "middle-top":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_TOP;
        overlayFrame.align = mx.mxConstants.ALIGN_CENTER;
        break;
      case "middle-bottom":
        overlayFrame.verticalAlign = mx.mxConstants.ALIGN_BOTTOM;
        overlayFrame.align = mx.mxConstants.ALIGN_CENTER;
        break;
    }
    let offx = 0;
    let offy = 0;
    if (offset_x) {
      offx = offset_x;
    }
    if (offset_y) {
      offy = offset_y;
    }
    overlayFrame.offset = new mx.mxPoint(offx, offy);
    graphRef.current.addCellOverlay(cell, overlayFrame);
    graphRef.current.refresh();
  }


  function zoomIn() {
    graphRef.current.zoomIn();
  }

  function zoomOut() {
    graphRef.current.zoomOut();
  }


  function processException(ex) {
    alert(JSON.stringify(ex));
  }

  function btnZoomIn_onClick(e) {
    try {
      zoomIn();
    } catch (ex) {
      processException(ex);
    }
  }

  function btnZoomOut_onClick(e) {
    try {
      zoomOut();
    } catch (ex) {
      processException(ex);
    }
  } 

  function showMessageModal(title, message) {
      setShowMessage(true);
      setMessageModalTitle(title);
      setMessageModalContent(message);
  }

  function hideMessageModal() {
    setShowMessage(false);
  }

    return (
      <div ref={containerRef} className="MxGEditor">
        <div className="header">
          <button type="button" title="Zoom in" onClick={btnZoomIn_onClick}>
            <span><ZoomIn /></span>
          </button>          
          <button type="button" title="Zoom out" onClick={btnZoomOut_onClick}>
            <span><ZoomOut /></span>
          </button>        
        </div>
        <div ref={graphContainerRef} className="GraphContainer" style={{ position: "relative" }}>
        </div>
        <div>
          <Modal
            show={showMessage}
            onHide={hideMessageModal}
            size="lg"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {messageModalTitle}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={{ maxHeight: "65vh", overflow: "auto" }}>
                <p>{messageModalContent}</p>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={hideMessageModal}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  }

