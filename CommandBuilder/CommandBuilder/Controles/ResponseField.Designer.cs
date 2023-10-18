
namespace CommandBuilder {
	partial class ResponseField {
		/// <summary> 
		/// Variable del diseñador necesaria.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary> 
		/// Limpiar los recursos que se estén usando.
		/// </summary>
		/// <param name="disposing">true si los recursos administrados se deben desechar; false en caso contrario.</param>
		protected override void Dispose(bool disposing) {
			if(disposing && (components != null)) {
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Código generado por el Diseñador de componentes

		/// <summary> 
		/// Método necesario para admitir el Diseñador. No se puede modificar
		/// el contenido de este método con el editor de código.
		/// </summary>
		private void InitializeComponent() {
			this.pnlResponseField = new System.Windows.Forms.Panel();
			this.tbParámetros = new ControLib.SleekTextBox();
			this.tbNombre = new ControLib.SleekTextBox();
			this.btnRemoveAlias = new ControLib.SleekButton();
			this.pnlTítulo = new System.Windows.Forms.Panel();
			this.pnlContenedorTítulo = new System.Windows.Forms.Panel();
			this.lblTítulo = new System.Windows.Forms.Label();
			this.label1 = new System.Windows.Forms.Label();
			this.lblParámetros = new System.Windows.Forms.Label();
			this.pnlResponseField.SuspendLayout();
			this.pnlTítulo.SuspendLayout();
			this.pnlContenedorTítulo.SuspendLayout();
			this.SuspendLayout();
			// 
			// pnlResponseField
			// 
			this.pnlResponseField.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(18)))), ((int)(((byte)(18)))), ((int)(((byte)(18)))));
			this.pnlResponseField.Controls.Add(this.tbParámetros);
			this.pnlResponseField.Controls.Add(this.lblParámetros);
			this.pnlResponseField.Controls.Add(this.tbNombre);
			this.pnlResponseField.Controls.Add(this.pnlTítulo);
			this.pnlResponseField.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlResponseField.Location = new System.Drawing.Point(0, 0);
			this.pnlResponseField.Name = "pnlResponseField";
			this.pnlResponseField.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlResponseField.Size = new System.Drawing.Size(235, 179);
			this.pnlResponseField.TabIndex = 4;
			// 
			// tbParámetros
			// 
			this.tbParámetros.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbParámetros.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbParámetros.BorderRadius = 16F;
			this.tbParámetros.BorderSize = 0F;
			this.tbParámetros.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbParámetros.Dock = System.Windows.Forms.DockStyle.Top;
			this.tbParámetros.FocusColor = System.Drawing.Color.Empty;
			this.tbParámetros.Font = new System.Drawing.Font("Microsoft Sans Serif", 11F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.tbParámetros.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbParámetros.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbParámetros.InputText = "";
			this.tbParámetros.Location = new System.Drawing.Point(0, 93);
			this.tbParámetros.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbParámetros.Multiline = true;
			this.tbParámetros.Name = "tbParámetros";
			this.tbParámetros.PasswordChar = '\0';
			this.tbParámetros.PercentualRadius = false;
			this.tbParámetros.PlaceHolder = "Nombres de los parámetros separados por espacios";
			this.tbParámetros.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbParámetros.ReadOnly = false;
			this.tbParámetros.SelectAllOnClick = true;
			this.tbParámetros.Size = new System.Drawing.Size(235, 79);
			this.tbParámetros.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbParámetros.TabIndex = 4;
			this.tbParámetros.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbParámetros.WordWrap = true;
			// 
			// tbNombre
			// 
			this.tbNombre.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbNombre.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbNombre.BorderRadius = 100F;
			this.tbNombre.BorderSize = 0F;
			this.tbNombre.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.tbNombre.FocusColor = System.Drawing.Color.Empty;
			this.tbNombre.Font = new System.Drawing.Font("Microsoft Sans Serif", 11F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.tbNombre.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNombre.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNombre.InputText = "";
			this.tbNombre.Location = new System.Drawing.Point(0, 39);
			this.tbNombre.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbNombre.Multiline = false;
			this.tbNombre.Name = "tbNombre";
			this.tbNombre.PasswordChar = '\0';
			this.tbNombre.PercentualRadius = true;
			this.tbNombre.PlaceHolder = "Nombre";
			this.tbNombre.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbNombre.ReadOnly = false;
			this.tbNombre.SelectAllOnClick = true;
			this.tbNombre.Size = new System.Drawing.Size(235, 39);
			this.tbNombre.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbNombre.TabIndex = 0;
			this.tbNombre.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbNombre.WordWrap = true;
			// 
			// btnRemoveAlias
			// 
			this.btnRemoveAlias.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.btnRemoveAlias.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnRemoveAlias.BorderRadius = 100F;
			this.btnRemoveAlias.BorderSize = 0F;
			this.btnRemoveAlias.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnRemoveAlias.FlatAppearance.BorderSize = 0;
			this.btnRemoveAlias.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnRemoveAlias.Font = new System.Drawing.Font("Arial Black", 8F, System.Drawing.FontStyle.Bold);
			this.btnRemoveAlias.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(196)))), ((int)(((byte)(130)))));
			this.btnRemoveAlias.Location = new System.Drawing.Point(196, 0);
			this.btnRemoveAlias.Name = "btnRemoveAlias";
			this.btnRemoveAlias.PercentualRadius = true;
			this.btnRemoveAlias.Size = new System.Drawing.Size(39, 39);
			this.btnRemoveAlias.TabIndex = 8;
			this.btnRemoveAlias.Text = "✖";
			this.btnRemoveAlias.UseVisualStyleBackColor = false;
			// 
			// pnlTítulo
			// 
			this.pnlTítulo.Controls.Add(this.pnlContenedorTítulo);
			this.pnlTítulo.Controls.Add(this.btnRemoveAlias);
			this.pnlTítulo.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTítulo.Location = new System.Drawing.Point(0, 0);
			this.pnlTítulo.Name = "pnlTítulo";
			this.pnlTítulo.Size = new System.Drawing.Size(235, 39);
			this.pnlTítulo.TabIndex = 5;
			// 
			// pnlContenedorTítulo
			// 
			this.pnlContenedorTítulo.Controls.Add(this.lblTítulo);
			this.pnlContenedorTítulo.Controls.Add(this.label1);
			this.pnlContenedorTítulo.Dock = System.Windows.Forms.DockStyle.Fill;
			this.pnlContenedorTítulo.Location = new System.Drawing.Point(0, 0);
			this.pnlContenedorTítulo.Name = "pnlContenedorTítulo";
			this.pnlContenedorTítulo.Size = new System.Drawing.Size(196, 39);
			this.pnlContenedorTítulo.TabIndex = 9;
			// 
			// lblTítulo
			// 
			this.lblTítulo.Dock = System.Windows.Forms.DockStyle.Fill;
			this.lblTítulo.Font = new System.Drawing.Font("Segoe UI Black", 11F);
			this.lblTítulo.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(206)))), ((int)(((byte)(206)))), ((int)(((byte)(206)))));
			this.lblTítulo.Location = new System.Drawing.Point(0, 15);
			this.lblTítulo.Name = "lblTítulo";
			this.lblTítulo.Size = new System.Drawing.Size(196, 24);
			this.lblTítulo.TabIndex = 8;
			this.lblTítulo.Text = "Respuesta de Interacción";
			this.lblTítulo.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// label1
			// 
			this.label1.AutoSize = true;
			this.label1.Dock = System.Windows.Forms.DockStyle.Top;
			this.label1.Font = new System.Drawing.Font("Lato Black", 9F);
			this.label1.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.label1.Location = new System.Drawing.Point(0, 0);
			this.label1.Name = "label1";
			this.label1.Size = new System.Drawing.Size(75, 15);
			this.label1.TabIndex = 9;
			this.label1.Text = "RESPUESTA";
			this.label1.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// lblParámetros
			// 
			this.lblParámetros.AutoSize = true;
			this.lblParámetros.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblParámetros.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblParámetros.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblParámetros.Location = new System.Drawing.Point(0, 78);
			this.lblParámetros.Name = "lblParámetros";
			this.lblParámetros.Size = new System.Drawing.Size(90, 15);
			this.lblParámetros.TabIndex = 3;
			this.lblParámetros.Text = "PARÁMETROS";
			this.lblParámetros.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// ResponseField
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(18)))), ((int)(((byte)(18)))), ((int)(((byte)(18)))));
			this.Controls.Add(this.pnlResponseField);
			this.Name = "ResponseField";
			this.Size = new System.Drawing.Size(235, 179);
			this.pnlResponseField.ResumeLayout(false);
			this.pnlResponseField.PerformLayout();
			this.pnlTítulo.ResumeLayout(false);
			this.pnlContenedorTítulo.ResumeLayout(false);
			this.pnlContenedorTítulo.PerformLayout();
			this.ResumeLayout(false);

		}

		#endregion
		public ControLib.SleekTextBox tbParámetros;
		public ControLib.SleekTextBox tbNombre;
		public System.Windows.Forms.Panel pnlResponseField;
		private System.Windows.Forms.Panel pnlTítulo;
		public ControLib.SleekButton btnRemoveAlias;
		private System.Windows.Forms.Panel pnlContenedorTítulo;
		private System.Windows.Forms.Label label1;
		private System.Windows.Forms.Label lblTítulo;
		private System.Windows.Forms.Label lblParámetros;
	}
}
