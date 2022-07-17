import { RouteHandler } from "../@types/RouteHandler";

class RouteNode {
  label: string;
  children: RouteNode[];
  handler: RouteHandler | null;

  wildcardChild: RouteNode | null;
  parametricChild: RouteNode | null;
  params: string[];

  constructor(label: string) {
    this.label = label;
    this.children = [];
    this.handler = null;
    this.wildcardChild = null;
    this.parametricChild = null;
    this.params = [];
  }
}

export default RouteNode;
