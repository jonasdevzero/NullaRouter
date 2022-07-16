import { RouteHandler } from "../@types/RouteHandler";

class RouteNode {
  label: string;
  children: RouteNode[];
  handler: RouteHandler | null;

  wildcardChild: RouteNode | null;
  parametricChild: RouteNode | null;
  paramsName: string[];

  constructor(label: string) {
    this.label = label;
    this.children = [];
    this.handler = null;
    this.wildcardChild = null;
    this.parametricChild = null;
    this.paramsName = [];
  }
}

export default RouteNode;
